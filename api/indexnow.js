// IndexNow: site haritasındaki tüm adresleri Bing/Yandex/Seznam/Naver'e bildirir (ChatGPT araması Bing dizinini kullanır)
// Vercel cron her gün çağırır; elle de açılabilir: /api/indexnow
const KEY = "813a45b5cf4b0b3faeb4dcbb08503b73";
export async function GET(request) {
  const host = new URL(request.url).host.replace(/^www\./, "");
  const base = `https://${host}`;
  let urls = [];
  try {
    const xml = await (await fetch(`${base}/sitemap.xml`, { cache: "no-store" })).text();
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(base));
  } catch {}
  if (!urls.length) return Response.json({ ok: false, error: "no-urls" }, { status: 500 });
  const ep = new URL(request.url).searchParams.get("ep") === "bing" ? "https://www.bing.com/indexnow" : "https://api.indexnow.org/indexnow";
  const r = await fetch(ep, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${base}/${KEY}.txt`, urlList: urls.slice(0, 10000) }),
  });
  const detail = (await r.text().catch(() => "")).slice(0, 300);
  return Response.json({ ok: r.status === 200 || r.status === 202, status: r.status, detail, submitted: urls.length }, { headers: { "Cache-Control": "no-store" } });
}
