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
5. Open **Settings**.
6. Tap **Allow + subscribe**, then **Send server test**. Lock the phone — that is the locked-phone path.

Cron: Sunday 13:00 UTC (`0 13 * * 0`) = 9:00 America/Toronto during EDT.

## Local

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site into dist/
npm run preview   # serve dist/
```

`.env.example` lists the variables the push reminder needs. The board itself
builds and runs without any of them.

---

## How it's built

A static [Astro 5](https://astro.build) site. Every page is rendered at build
time from files in this repo; the only server code is the push-reminder
functions in `api/`.

```
src/
  content/weeks/*.md     one file per ISO week — the published averages
  content.config.ts      schema for those files (a bad value fails the build)
  data/workouts.json     one row per day: workout count and types, for the calendar
  layouts/Base.astro     <head>, theme, header, nav, mobile dock
  pages/
    index.astro          the board: this week's stats, calendar, six trend charts, week list
    weeks/[week].astro   one page per week file
    settings.astro       push-reminder setup and the published-source note
  components/
    WorkoutGraph.astro   workout calendar + the five most recent sessions
    Reminder.astro       Allow + subscribe / test buttons for Web Push
  lib/push-vapid.ts      public VAPID key, shared with the browser
  styles/global.css      this app's layout (no colours — see Theme)
api/                     Vercel functions: /api/push/*, /api/cron/remind
public/                  service worker, web manifest, favicon
```

### The UI comes from `@omarchy/ui`

The stat tiles, workout calendar, trend charts and theme toggle are not built
here. They come from
[`@omarchy/ui`](https://github.com/aleccool213/omarchy-astro-ui), the component
library shared by this app, Split Log, household-money and bigal. The
storyboard at https://omarchy-astro-ui.vercel.app shows every component in both
themes.

| Library component   | Used in                                  | Replaced                          |
|---------------------|------------------------------------------|-----------------------------------|
| `OmStat`, `OmStatGrid` | `index.astro`, `weeks/[week].astro`   | `components/Stat.astro`           |
| `OmActivityHeatmap` | `components/WorkoutGraph.astro`          | the hand-built week grid          |
| `OmTimeSeriesChart` | `index.astro` (six charts)               | `components/TrendChart.astro`     |
| `OmThemeScript`     | `layouts/Base.astro` `<head>`            | inline no-flash script            |
| `OmThemeToggle`     | `layouts/Base.astro` header              | the "Aa" button and its handler   |

Still built here: the header, desktop nav and mobile dock; the recent-sessions
list; the reminder panel; and page layout.

The props this app relies on, and why:

- **Stats** pass `unitPlacement="block"` so the unit sits under the figure, and
  steps use `format="locale"` for "3,386".
- **The calendar** passes `cellSize="56px"` to keep its large squares (the
  library defaults to a denser 20px); `thresholds={[1, 2, 3]}` so one workout is
  one colour step; and `formatTip` so a day's tooltip names the workout
  ("2026-06-19 · 1 workout · Yoga").
- **The four weekly line charts** pass `markers` to dot every week. Charts with
  `format="int"` tick in whole numbers.

#### How the library is installed

`package.json` pins the library to one release commit:

```jsonc
"@omarchy/ui": "github:aleccool213/omarchy-astro-ui#c17a223e524349696831a9dc748c08387116ebb3"   // 0.2.0
```

It installs straight from GitHub; nothing is published to npm. The library
ships source (`.astro`, `.ts`, `.css`) rather than a build, which is why
`astro.config.mjs` has `vite.ssr.noExternal: ['@omarchy/ui']` — it tells Vite
to compile the package instead of treating it as pre-built.

**To take a newer library release**, change the commit (or tag) at the end of
that line and run `npm install`. Changing the string is what makes npm fetch
it: an unchanged pin counts as already installed. That bit this project while
it pointed at `#main` — Vercel restores `node_modules` from its build cache, so
preview builds kept using an old copy of the library long after it had moved
on, while local builds of the same commit used the new one. A pin also means
pushing to the library never changes this site until this line changes.
Releases and what they changed are in the library's
[`CHANGELOG.md`](https://github.com/aleccool213/omarchy-astro-ui/blob/main/CHANGELOG.md).

The repo does not commit `package-lock.json` (it is gitignored); the pinned
commit is what keeps library builds reproducible.

### Theme

This app defines no colours of its own. `Base.astro` imports four stylesheets,
and the order matters:

1. `@omarchy/ui/components.css` — the library's component classes and design
   tokens. Deliberately **not** `styles.css`: that one also restyles the body,
   headings and links, which this app already owns.
2. `@omarchy/ui/themes/lupine.css` — the palette, light and dark: periwinkle
   accent, square corners, pixel-grid background.
3. `@omarchy/ui/compat.css` — maps the variable names `global.css` still uses
   (`--bg`, `--card`, `--ink`, `--muted`, `--line`, `--accent`, `--kind` …) onto
   the theme's `--om-*` tokens.
4. `src/styles/global.css` — this app's layout. Last, so it wins any overlap.

In new CSS, prefer the theme's names directly (`var(--om-surface)`,
`var(--om-fg-muted)`, `var(--om-accent)`); the old names exist only so
existing rules keep working.

**Light / dark.** `OmThemeScript` runs in `<head>` before the page paints and
puts `.light` or `.dark` on `<html>`. With no saved choice it follows the
device setting. Clicking the header toggle (☾ / ☀) saves the choice in
`localStorage` under `om-theme`, the key every app on the library uses.
`legacyKey="health-board-theme"` carries across a choice saved under this
app's old key, once, then deletes the old entry, so switching keys reset
nobody's preference. It is safe to leave in place.

### Deploying

Vercel builds on every push: `main` goes to production, any other branch gets a
public preview URL. `vercel.json` only declares the Sunday cron; everything
else is Vercel's Astro defaults.

After changing the library pin, check the preview actually picked it up — for
example, that the trend charts show a dot on every week. A build that silently
reused a cached library still succeeds.
