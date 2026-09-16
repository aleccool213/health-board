const FALLBACK_PUBLIC =
  "BHLuym4du_T_Sdvx-3G_UcCMzf_m3Ny0NzEkllGvMlaxCWHTiWCIeLidDkCRcL2T5cNvZr4ZukQvltUJSctssaQ";

function hasKv() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  return Boolean(url && token);
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    publicKey: (process.env.VAPID_PUBLIC_KEY || FALLBACK_PUBLIC).trim(),
    kvReady: hasKv(),
    vapidReady: Boolean((process.env.VAPID_PRIVATE_KEY || "").trim()),
  });
}
