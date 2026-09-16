const CACHE = "health-board-v2";
const PRECACHE = ["/", "/manifest.webmanifest", "/favicon.svg"];

const REMINDER_TITLE = "Import weekly health report";
const REMINDER_BODY =
  "Roll this week's Health.md days into the public board (sync health).";

function reminderOptions(tag, url) {
  return {
    body: REMINDER_BODY,
    tag: tag || "weekly-import",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    renotify: true,
    data: { url: url || "/?import=1" },
  };
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/?import=1";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          await client.focus();
          client.postMessage({ type: "import-reminder" });
          return;
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || REMINDER_TITLE, reminderOptions(payload.tag, payload.url))
  );
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "weekly-import-reminder") return;
  event.waitUntil(maybeNotifySunday());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "show-import-reminder") {
    event.waitUntil(self.registration.showNotification(REMINDER_TITLE, reminderOptions(data.tag, data.url)));
    return;
  }
  if (data.type === "schedule-import-reminder" && typeof data.at === "number") {
    event.waitUntil(scheduleTriggered(data.at, data.tag));
  }
});

async function scheduleTriggered(at, tag) {
  const Trigger = self.TimestampTrigger;
  if (typeof Trigger !== "function") return;
  try {
    await self.registration.showNotification(REMINDER_TITLE, {
      ...reminderOptions(tag),
      showTrigger: new Trigger(at),
    });
  } catch (e) {}
}

async function maybeNotifySunday() {
  const parts = torontoParts(new Date());
  if (parts.weekday !== "Sun") return;
  const tag = `weekly-import-${parts.isoWeek}`;
  const existing = await self.registration.getNotifications({ tag });
  if (existing.length) return;
  await self.registration.showNotification(REMINDER_TITLE, reminderOptions(tag));
}

function torontoParts(date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") bag[p.type] = p.value;
  }
  const utc = Date.UTC(Number(bag.year), Number(bag.month) - 1, Number(bag.day));
  const iso = isoWeekFromUtcDate(utc);
  return { weekday: bag.weekday, isoWeek: iso, hour: Number(bag.hour), minute: Number(bag.minute) };
}

function isoWeekFromUtcDate(utcMs) {
  const d = new Date(utcMs);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
