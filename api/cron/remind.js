import { isAuthorizedCron } from "../lib/cron-auth.js";
import { hasKv } from "../lib/kv.js";
import { sendToAll } from "../lib/push-send.js";

export default async function handler(req, res) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers || {})) {
    if (typeof v === "string") headers.set(k, v);
  }
  const url = `https://${req.headers.host || "localhost"}${req.url}`;
  const request = new Request(url, { method: req.method, headers });
  if (!isAuthorizedCron(request)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  try {
    if (!hasKv()) return res.status(500).json({ ok: false, skipped: "no redis" });
    const result = await sendToAll({
      title: "Import weekly health report",
      body: "Roll this week's Health.md days into the public board (sync health).",
      url: "/?import=1",
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "Remind failed" });
  }
}
