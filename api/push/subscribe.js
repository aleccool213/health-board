import { hasKv } from "../lib/kv.js";
import { isPushSub, savePushSub } from "../lib/push-store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  try {
    if (!hasKv()) return res.status(200).json({ ok: false, error: "Marketplace Redis is not connected on this deploy." });
    const data = req.body && req.body.data ? req.body.data : req.body;
    if (!isPushSub(data)) return res.status(200).json({ ok: false, error: "Invalid subscription." });
    await savePushSub(data);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err instanceof Error ? err.message : "Could not save subscription." });
  }
}
