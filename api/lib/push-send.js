import webpush from "web-push";
import { listPushSubs, removePushSub } from "./push-store.js";

const FALLBACK_PUBLIC =
  "BHLuym4du_T_Sdvx-3G_UcCMzf_m3Ny0NzEkllGvMlaxCWHTiWCIeLidDkCRcL2T5cNvZr4ZukQvltUJSctssaQ";

function vapid() {
  const pub = (process.env.VAPID_PUBLIC_KEY || FALLBACK_PUBLIC).trim();
  const priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = (process.env.VAPID_SUBJECT || "mailto:alec@alec.coffee").trim();
  if (!priv) throw new Error("VAPID_PRIVATE_KEY is not set on Vercel.");
  webpush.setVapidDetails(subject, pub, priv);
}

export async function sendToSub(sub, message) {
  vapid();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify({
        title: message.title,
        body: message.body,
        url: message.url ?? "/?import=1",
      }),
    );
    return "sent";
  } catch (err) {
    const status = err?.statusCode;
    if (status === 404 || status === 410) {
      await removePushSub(sub.endpoint);
      return "gone";
    }
    throw err;
  }
}

export async function sendToAll(message) {
  const subs = await listPushSubs();
  let sent = 0;
  let gone = 0;
  for (const sub of subs) {
    const result = await sendToSub(sub, message);
    if (result === "sent") sent += 1;
    else gone += 1;
  }
  return { sent, gone };
}
