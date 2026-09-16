import { createHash } from "node:crypto";
import { kvCommand } from "./kv.js";

const SET_KEY = "health-board:push:endpoints";

function idFor(endpoint) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 24);
}

function recKey(id) {
  return `health-board:push:sub:${id}`;
}

export function isPushSub(value) {
  if (!value || typeof value !== "object") return false;
  const keys = value.keys;
  return (
    typeof value.endpoint === "string" &&
    Boolean(keys) &&
    typeof keys.p256dh === "string" &&
    typeof keys.auth === "string"
  );
}

export async function savePushSub(sub) {
  const id = idFor(sub.endpoint);
  await kvCommand(["SET", recKey(id), JSON.stringify(sub)]);
  await kvCommand(["SADD", SET_KEY, id]);
}

export async function removePushSub(endpoint) {
  const id = idFor(endpoint);
  await kvCommand(["DEL", recKey(id)]);
  await kvCommand(["SREM", SET_KEY, id]);
}

export async function listPushSubs() {
  const ids = (await kvCommand(["SMEMBERS", SET_KEY])) ?? [];
  const out = [];
  for (const id of ids) {
    const raw = await kvCommand(["GET", recKey(id)]);
    if (!raw) continue;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (isPushSub(parsed)) out.push(parsed);
  }
  return out;
}
