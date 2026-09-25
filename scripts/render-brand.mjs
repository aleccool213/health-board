// Renders the app icon set and the link-preview card.
// Run: node scripts/render-brand.mjs  (uses Playwright + Chromium)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync, execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = (f) => join(root, "public", f);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  // fall back to a globally installed playwright
  const g = execSync("npm root -g").toString().trim();
  ({ chromium } = createRequire(join(g, "noop.js"))("playwright"));
}

const BLUE = "#4f6ef7";
const PALE = "#c5cffc";
const WHITE = "#ffffff";

// 16x16 pixel heart, drawn at 2x on a 32x32 grid so the ECG trace can be one cell thin.
const HEART = [
  "................",
  "................",
  "................",
  "...###....###...",
  "..#####..#####..",
  "..############..",
  "..############..",
  "..############..",
  "...##########...",
  "....########....",
  ".....######.....",
  "......####......",
  ".......##.......",
  "................",
  "................",
  "................",
];
// ECG trace on the 32x32 grid: [col, row]
const PULSE = [];
const hline = (r, c0, c1) => { for (let c = c0; c <= c1; c++) PULSE.push([c, r]); };
const vline = (c, r0, r1) => { for (let r = r0; r <= r1; r++) PULSE.push([c, r]); };
hline(15, 0, 10);
vline(11, 9, 15);
hline(9, 11, 13);
vline(13, 9, 21);
hline(21, 13, 15);
vline(15, 15, 21);
hline(15, 15, 31);
const G = 32;

function iconSvg({ size = 16, pad = 0, bg = true } = {}) {
  const pulse = new Set(PULSE.map(([c, r]) => `${c},${r}`));
  const paths = { [WHITE]: "", [PALE]: "" };
  for (let r = 0; r < G; r++) {
    let run = null;
    for (let c = 0; c <= G; c++) {
      const inHeart = c < G && HEART[r >> 1][c >> 1] === "#";
      const onPulse = pulse.has(`${c},${r}`);
      const fill = inHeart && !onPulse ? WHITE : !inHeart && onPulse ? PALE : null;
      if (run && run.fill !== fill) {
        paths[run.fill] += `M${run.c} ${r}h${c - run.c}v1h-${c - run.c}z`;
        run = null;
      }
      if (fill && !run) run = { fill, c };
    }
  }
  const rects = Object.entries(paths).map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`);
  const s = G + pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${s} ${s}" width="${size}" height="${size}" shape-rendering="crispEdges">
${bg ? `  <rect x="${-pad}" y="${-pad}" width="${s}" height="${s}" fill="${BLUE}"/>\n` : ""}  ${rects.join("\n  ")}
</svg>
`;
}

// Headless Chromium can't always reach Google Fonts, so inline the TTFs as data URIs.
function fontFaces() {
  const get = (url, enc) => execFileSync("curl", ["-fsSL", url], { encoding: enc, maxBuffer: 1 << 24 });
  const css = get("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;800", "utf8");
  return css.replace(/url\((https:[^)]+)\)/g, (_, url) => `url(data:font/ttf;base64,${get(url, "buffer").toString("base64")})`);
}

const workouts = JSON.parse(readFileSync(join(root, "src/data/workouts.json"), "utf8"));

function heatmap() {
  const by = new Map(workouts.map((d) => [d.date, d.workouts]));
  const last = new Date(workouts[workouts.length - 1].date + "T00:00:00Z");
  const endSun = new Date(last);
  endSun.setUTCDate(last.getUTCDate() + ((7 - last.getUTCDay()) % 7));
  const cols = 14;
  const cells = [];
  const colors = ["#ececec", "#c5cffc", "#7b8cff", "#4f6ef7"];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 7; r++) {
      const d = new Date(endSun);
      d.setUTCDate(endSun.getUTCDate() - (cols - 1 - c) * 7 - (6 - r));
      const n = by.get(d.toISOString().slice(0, 10)) ?? 0;
      cells.push(`<i style="grid-column:${c + 1};grid-row:${r + 1};background:${colors[Math.min(n, 3)]}"></i>`);
    }
  }
  return cells.join("");
}

const cardHtml = `<!doctype html><html><head><meta charset="utf-8">
<style>
${fontFaces()}
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; font-family: "JetBrains Mono", monospace; color: #000;
    background: #fafafa radial-gradient(${PALE} 2.4px, transparent 2.4px) 0 0 / 30px 30px; }
  .card { position: absolute; inset: 60px; background: #fff; border: 2px solid #d4d4d4;
    display: flex; align-items: center; justify-content: space-between; padding: 0 64px; gap: 48px; }
  .card::after { content: ""; position: absolute; left: -2px; right: -2px; top: -2px; height: 12px; background: ${BLUE}; }
  .left { display: flex; flex-direction: column; gap: 22px; }
  .brand { display: flex; align-items: center; gap: 26px; }
  .brand svg { width: 104px; height: 104px; display: block; }
  h1 { font-size: 74px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
  p { font-size: 30px; color: #555; line-height: 1.35; max-width: 520px; }
  .tags { display: flex; gap: 12px; margin-top: 6px; }
  .tags span { font-size: 20px; font-weight: 500; padding: 8px 14px; border: 2px solid #d4d4d4; color: #000; }
  .tags span.hot { background: ${BLUE}; color: #fff; border-color: ${BLUE}; }
  .grid { display: grid; grid-template-columns: repeat(14, 26px); grid-template-rows: repeat(7, 26px); gap: 6px; }
  .grid i { display: block; }
  .legend { margin-top: 18px; font-size: 18px; color: #555; display: flex; justify-content: space-between; }
</style></head><body>
<div class="card">
  <div class="left">
    <div class="brand">${iconSvg({ size: 104 })}<h1>Health<br>board</h1></div>
    <p>Weekly Apple Watch averages — steps, sleep, heart, workouts.</p>
    <div class="tags"><span class="hot">Steps</span><span>Sleep</span><span>HRV</span><span>Workouts</span></div>
  </div>
  <div>
    <div class="grid">${heatmap()}</div>
    <div class="legend"><span>Workouts · 14 wks</span><span>Mon–Sun</span></div>
  </div>
</div>
</body></html>`;

writeFileSync(pub("favicon.svg"), iconSvg({ size: 32 }).replace(' width="32" height="32"', ""));

const browser = await chromium.launch(
  process.env.PLAYWRIGHT_BROWSERS_PATH ? {} : { executablePath: "/opt/pw-browsers/chromium" },
);
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function png(html, w, h, out) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: pub(out), clip: { x: 0, y: 0, width: w, height: h } });
  console.log("wrote public/" + out);
}

const iconPage = (svg, s) =>
  `<!doctype html><style>*{margin:0}svg{display:block;width:${s}px;height:${s}px}</style>${svg}`;

for (const s of [180, 192, 512]) {
  await png(iconPage(iconSvg({ size: s }), s, s), s, s, s === 180 ? "apple-touch-icon.png" : `icon-${s}.png`);
}
// Maskable: extra padding keeps the heart inside the 80% safe zone.
await png(iconPage(iconSvg({ size: 512, pad: 6 }), 512), 512, 512, "icon-maskable-512.png");
await png(cardHtml, 1200, 630, "og.png");

await browser.close();
