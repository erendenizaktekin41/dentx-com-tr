// dentx.com.tr formları (randevu + iletişim) → e-posta (varsayılan: randevu@dentx.com.tr)
// Gönderim: RESEND_API_KEY varsa Resend, yoksa SMTP (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS)
import nodemailer from "nodemailer";
import { json, clientIp, rateLimit } from "./_lib/redis.js";

const TO = (process.env.LEAD_TO || "randevu@dentx.com.tr").split(",").map((s) => s.trim()).filter(Boolean);
const FROM = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@dentx.com.tr";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const field = (fd, k, n = 300) => String(fd.get(k) ?? "").trim().slice(0, n);

export async function POST(request) {
  let fd;
  try { fd = await request.formData(); } catch { return json({ ok: false, error: "bad-request" }, 400); }

  // spam: gizli alan dolu ya da 2 sn'den kısa sürede gönderildiyse sessizce kabul et
  if (field(fd, "website") || Number(field(fd, "t")) < 2000) return json({ ok: true });
  if (!(await rateLimit("lead-tr", clientIp(request), 6, 3600))) return json({ ok: false, error: "rate" }, 429);

  const kind = field(fd, "form", 20) === "iletisim" ? "iletisim" : "randevu";
  const d = {
    name: field(fd, "name", 120), phone: field(fd, "phone", 40), email: field(fd, "email", 160),
    clinic: field(fd, "clinic", 60), treatment: field(fd, "treatment", 120), message: field(fd, "message", 3000),
    page: field(fd, "page", 400), referrer: field(fd, "referrer", 400),
    utm: ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"].map((k) => [k, field(fd, k, 200)]).filter(([, v]) => v),
  };
  if (!d.name || field(fd, "consent") !== "yes") return json({ ok: false, error: "invalid" }, 400);
  if (kind === "randevu" && d.phone.replace(/\D/g, "").length < 10) return json({ ok: false, error: "invalid" }, 400);
  if (kind === "iletisim" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return json({ ok: false, error: "invalid" }, 400);

  const rows = [
    ["Form", kind === "randevu" ? "Randevu talebi" : "İletişim formu"],
    ["Ad Soyad", d.name], ["Telefon", d.phone || "—"], ...(d.email ? [["E-posta", d.email]] : []),
    ["Klinik", d.clinic || "—"], ...(d.treatment ? [["Tedavi", d.treatment]] : []), ...(d.message ? [["Mesaj", d.message]] : []),
    ["Sayfa", d.page], ["Geldiği yer", d.referrer || "—"], ...d.utm, ["Onay", "KVKK aydınlatma + açık rıza işaretlendi"],
  ];
  const tel = d.phone.replace(/\D/g, "");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0C1F3B">
    <h2 style="margin:0 0 12px">${kind === "randevu" ? "Yeni randevu talebi" : "Yeni iletişim mesajı"} · ${esc(d.clinic || "Klinik fark etmez")}</h2>
    <table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="color:#56698A;border-bottom:1px solid #eee;vertical-align:top">${esc(k)}</td><td style="border-bottom:1px solid #eee;white-space:pre-wrap"><b>${esc(v)}</b></td></tr>`).join("")}</table>
    ${tel ? `<p style="margin-top:16px"><a href="tel:${tel}">Ara: ${esc(d.phone)}</a> · <a href="https://wa.me/${tel.startsWith("0") ? "9" + tel : tel}">WhatsApp</a></p>` : ""}</div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const subject = `DentX ${kind === "randevu" ? "Randevu" : "İletişim"} · ${d.name} · ${d.clinic || "Fark etmez"}${d.treatment ? " · " + d.treatment : ""}`;

  try {
    await send({ subject, html, text, replyTo: d.email || undefined });
  } catch (e) {
    console.error("lead mail failed", e?.message);
    return json({ ok: false, error: "mail" }, 502);
  }
  return json({ ok: true });
}

async function send({ subject, html, text, replyTo }) {
  if (process.env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: TO, subject, html, text, reply_to: replyTo }),
    });
    if (!r.ok) throw new Error(`resend ${r.status} ${await r.text()}`);
    return;
  }
  if (!process.env.SMTP_HOST) throw new Error("no mail transport configured");
  const port = Number(process.env.SMTP_PORT || 465);
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await t.sendMail({ from: `DentX <${FROM}>`, to: TO, subject, html, text, replyTo });
}
