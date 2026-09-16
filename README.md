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

## Sunday import reminder (same path as Split Log)

Closed-phone banners use Web Push + Marketplace Redis + a Vercel cron.

1. Attach Redis on the Vercel project (Storage → Redis), same env names as Split Log.
2. Copy `VAPID_PRIVATE_KEY` from the Split Log project (public key is already the same pair).
3. Set `CRON_SECRET` if you want a bearer on `/api/cron/remind`.
4. Open the **Home Screen** Health board icon (not a Safari tab).
5. Tap **Allow + subscribe**, then **Send server test**. Lock the phone — that is the locked-phone path.

Cron: Sunday 13:00 UTC (`0 13 * * 0`) = 9:00 America/Toronto during EDT.

## Local

```bash
npm install
npm run dev
```
