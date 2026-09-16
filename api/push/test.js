import { hasKv } from "../lib/kv.js";
import { savePushSub } from "../lib/push-store.js";
import { sendToSub } from "../lib/push-send.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  try {
    if (!hasKv()) {
      return res.status(200).json({ ok: false, error: "Marketplace Redis is not connected. Add Redis in Vercel → Storage." });
    }
    if (!(process.env.VAPID_PRIVATE_KEY || "").trim()) {
      return res.status(200).json({ ok: false, error: "VAPID_PRIVATE_KEY is not set on this Vercel project." });
    }
    const data = req.body && req.body.data ? req.body.data : req.body;
    await savePushSub(data);
    const result = await sendToSub(data, {
      title: "Health board — server test",
      body: "This came from Vercel, not the open app. Phone can stay locked.",
      url: "/?import=1",
    });
    return res.status(200).json({ ok: true, result });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err instanceof Error ? err.message : "Server test failed." });
  }
}
