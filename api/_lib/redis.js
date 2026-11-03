// Upstash Redis (Vercel Marketplace) REST istemcisi — bağımlılık yok
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export const hasRedis = () => Boolean(URL_ && TOKEN);

export async function redis(...cmd) {
  if (!hasRedis()) throw new Error("redis-not-configured");
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `redis-${r.status}`);
  return j.result;
}

export const KEY = "dentx:consultations";

export async function readRows() {
  const raw = await redis("GET", KEY);
  if (!raw) return null;
  try { const rows = JSON.parse(raw); return Array.isArray(rows) ? rows : null; } catch { return null; }
}

export async function writeRows(rows) {
  await redis("SET", KEY, JSON.stringify(rows));
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

export function clientIp(request) {
  const xf = request.headers.get("x-forwarded-for") || "";
  return xf.split(",")[0].trim() || request.headers.get("x-real-ip") || "0.0.0.0";
}

// IP başına basit oran sınırı (Redis yoksa sınırsız)
export async function rateLimit(bucket, ip, max, windowSec) {
  if (!hasRedis()) return true;
  const { createHash } = await import("node:crypto");
  const k = `dentx:rl:${bucket}:${createHash("sha256").update(ip).digest("hex").slice(0, 24)}`;
  try {
    const n = await redis("INCR", k);
    if (n === 1) await redis("EXPIRE", k, windowSec);
    return n <= max;
  } catch { return true; }
}
