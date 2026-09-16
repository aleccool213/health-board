# Health board

Public weekly Apple Watch board. Friends can open the site with no account.

Live: https://health-board-delta.vercel.app

Daily Health.md notes live in Google Drive (`health.md backups`). This repo only stores **weekly averages**.

## Published fields

- steps / day
- sleep hours (average of nights that logged)
- resting HR
- HRV
- exercise minutes (sum)
- workout count
- active kcal (sum)

Not published: GPS, medications, bedtime, SpO2, wrist temperature, raw daily files.

Tap the ? beside a stat for a plain-English explainer.

## Update

1. Health.md writes a new daily note into Drive.
2. In Grok: `sync health` — weekly rollup is recomputed and committed here.
3. Vercel rebuilds.

ISO weeks are Monday–Sunday, America/Toronto.

## Sunday import reminder (PWA)

The installed PWA can nag you Sunday morning to import the week.

1. Open the live site (or Add to Home Screen).
2. Tap **Enable** on the Weekly import bar.
3. Allow notifications.

What fires:

- **Sunday 9:00 America/Toronto** when the browser supports notification triggers (Chromium).
- **Periodic background sync** on Android Chrome as a backup.
- **On open** during Sunday 6:00–14:00 Toronto if the reminder is enabled — this is the path that works in an iOS Home Screen PWA without a push server.
- Tap the notification (or `/?import=1`) to jump back to the board. Use **Test** to fire one immediately.

iOS will not wake a closed PWA on a timer by itself. If you need a lock-screen ping while the app is closed on iPhone, that needs Web Push + a Sunday cron — say if you want that next.

## Local

```bash
npm install
npm run dev
```
