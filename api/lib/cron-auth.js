import { timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.CRON_SECRET?.trim() || "";
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (!a || !b || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isAuthorizedCron(request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "none") return false;

  const expected = secret();
  const auth = request.headers.get("authorization") ?? "";
  if (expected && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token && safeEqual(token, expected)) return true;
  }

  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key") ?? url.searchParams.get("token") ?? "";
    if (expected && key && safeEqual(key, expected)) return true;
  } catch {}

  const ua = request.headers.get("user-agent") ?? "";
  if (ua.toLowerCase().includes("vercel-cron")) return true;

  return false;
}
