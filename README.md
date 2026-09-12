# Health board

Public weekly Apple Watch board. Friends can open the site with no account.

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

## Update

1. Health.md writes a new daily note into Drive.
2. In Grok: `sync health` — weekly rollup is recomputed and committed here.
3. Vercel rebuilds.

ISO weeks are Monday–Sunday, America/Toronto.

## Local

```bash
npm install
npm run dev
```
