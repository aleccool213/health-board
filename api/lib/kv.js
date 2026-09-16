function kvUrl() {
  return (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim();
}

function kvToken() {
  return (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
}

export function hasKv() {
  return Boolean(kvUrl() && kvToken());
}

export async function kvCommand(command) {
  const url = kvUrl();
  const token = kvToken();
  if (!url || !token) throw new Error("Marketplace Redis is not connected (KV_REST_API_URL / TOKEN).");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || `Redis ${res.status}`);
  return body.result;
}
