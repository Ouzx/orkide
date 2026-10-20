/**
 * Draws the brand originals from the skin (packages/ui tokens and fonts) into `design/incoming/`:
 * the favicon and app icon (the orchid mark on a sheet of blueprint paper), the link-preview images
 * (a drawing sheet with its title block and the stack drawn in isometric) and the email header (a
 * strip of the sheet). `pnpm --filter @orkide/web media` then turns them into the served files.
 * A product with its own skin edits the markup below, or drops its own originals into
 * `design/incoming/` instead.
 *
 * Run: `pnpm --filter @orkide/web brand` (renders with Playwright's Chromium; fonts come from
 * Google Fonts, so it needs the network).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { tokens } from "@orkide/ui/tokens/tokens";
import { chromium } from "@playwright/test";

import { resting, VIEW } from "../src/modules/home/axo.ts";

const incoming = path.resolve(import.meta.dirname, "../../../design/incoming");
const { blue } = tokens.color;

/** The orchid mark: three petals on construction geometry, a redline centre mark. */
const mark = (
  size: number,
  stroke: number
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="${size}" height="${size}">
  <circle cx="14" cy="14" r="12.5" fill="none" stroke="${blue["line-2"]}" stroke-width="${stroke * 0.6}" stroke-dasharray="3 2"/>
  <g fill="none" stroke="${blue.line}" stroke-width="${stroke}" stroke-linejoin="round">
    <path d="M14 14 C 10.6 9.6 10.8 4.6 14 2.4 C 17.2 4.6 17.4 9.6 14 14 Z"/>
    <path d="M14 14 C 19.4 14.8 23.6 18 23.2 21.8 C 19.6 23.4 15.4 20 14 14 Z"/>
    <path d="M14 14 C 12.6 20 8.4 23.4 4.8 21.8 C 4.4 18 8.6 14.8 14 14 Z"/>
  </g>
  <path d="M14 10.5 V 17.5 M 10.5 14 H 17.5" stroke="${blue.mark}" stroke-width="${stroke}"/>
</svg>`;

/** The favicon: the mark on a blue tile with a sheet border, drawn bold enough for 16 px. */
const favicon = (
  size: number
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <rect width="64" height="64" fill="${blue.paper}"/>
  <rect x="3" y="3" width="58" height="58" fill="none" stroke="${blue.line}" stroke-width="2.5"/>
  <g transform="translate(8 8) scale(1.7142857)">
    <g fill="none" stroke="${blue.line}" stroke-width="2.1" stroke-linejoin="round">
      <path d="M14 14 C 10.6 9.6 10.8 4.6 14 2.4 C 17.2 4.6 17.4 9.6 14 14 Z"/>
      <path d="M14 14 C 19.4 14.8 23.6 18 23.2 21.8 C 19.6 23.4 15.4 20 14 14 Z"/>
      <path d="M14 14 C 12.6 20 8.4 23.4 4.8 21.8 C 4.4 18 8.6 14.8 14 14 Z"/>
    </g>
    <path d="M14 10 V 18 M 10 14 H 18" stroke="${blue.mark}" stroke-width="2.1"/>
  </g>
</svg>
`;

/** The stack as the cover draws it at rest, as standalone SVG. */
const stack = (width: number) => {
  const drawing = resting();
  const parts = drawing.parts
    .map(
      (part) => `<g>
      ${part.fills.map((fill) => `<path d="${fill.d}" fill="${fill.top ? blue["paper-3"] : blue.paper}"/>`).join("")}
      <path d="${part.edges}" fill="none" stroke="${blue.line}" stroke-width="1.3" stroke-linejoin="round"/>
      ${part.deco ? `<path d="${part.deco}" fill="none" stroke="${blue["line-2"]}" stroke-width="0.9"/>` : ""}
      ${part.hatch ? `<path d="${part.hatch}" fill="${blue["line-3"]}" stroke="${blue["line-2"]}" stroke-width="0.9"/>` : ""}
      ${part.pixel ? `<path d="${part.pixel}" fill="${blue.mark}"/>` : ""}
      ${part.label ? `<text transform="${part.label.transform}" fill="${blue.ink}" font-family="Chivo Mono" font-weight="600" font-size="8.5">${part.label.text}</text>` : ""}
    </g>`
    )
    .join("");
  const balloons = drawing.balloons
    .map(
      (
        b
      ) => `<path d="M${b.x} ${b.y}L${b.bx} ${b.by}" stroke="${blue["line-2"]}"/>
      <circle cx="${b.bx}" cy="${b.by}" r="11.5" fill="${blue.paper}" stroke="${blue.line}" stroke-width="1.3"/>
      <text x="${b.bx}" y="${b.by + 3.6}" text-anchor="middle" fill="${blue.ink}" font-family="Chivo Mono" font-weight="600" font-size="10.5">${b.id}</text>`
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}" width="${width}" height="${(width * VIEW.height) / VIEW.width}">
    ${parts}
    <path d="${drawing.hidden}" fill="none" stroke="${blue["line-3"]}" stroke-dasharray="4 4"/>
    <path d="${drawing.explode}" fill="none" stroke="${blue["line-3"]}" stroke-dasharray="10 4 2 4"/>
    ${balloons}
  </svg>`;
};

const fonts =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Chivo+Mono:wght@400..700&display=block";

const page = (width: number, height: number, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><link rel="stylesheet" href="${fonts}"><style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${width}px; height: ${height}px; overflow: hidden; color: ${blue.ink}; font-family: Archivo, sans-serif;
    background-color: ${blue.paper};
    background-image:
      linear-gradient(${blue["grid-major"]} 1px, transparent 1px), linear-gradient(90deg, ${blue["grid-major"]} 1px, transparent 1px),
      linear-gradient(${blue.grid} 1px, transparent 1px), linear-gradient(90deg, ${blue.grid} 1px, transparent 1px);
    background-size: 40px 40px, 40px 40px, 8px 8px, 8px 8px;
  }
  .frame { position: absolute; inset: 14px; border: 3px solid ${blue.line}; }
  .frame::after { content: ""; position: absolute; inset: 22px; border: 1.5px solid ${blue["line-2"]}; }
  .label { font-family: "Chivo Mono", monospace; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${blue["ink-2"]}; }
  .title { font-weight: 800; font-stretch: 66%; text-transform: uppercase; line-height: 0.93; }
  .word { font-weight: 850; font-stretch: 125%; letter-spacing: 0.16em; text-transform: uppercase; }
  .block { position: absolute; display: grid; grid-template-columns: 1.6fr 1fr; border: 3px solid ${blue.line}; background: ${blue.paper}; }
  .block > div { padding: 10px 14px; border-right: 1.5px solid ${blue["line-2"]}; border-bottom: 1.5px solid ${blue["line-2"]}; }
  .block b { display: block; margin-top: 6px; font-weight: 800; font-stretch: 80%; font-size: 26px; text-transform: uppercase; }
  .accent { color: ${blue["mark-ink"]}; }
</style></head><body>${body}</body></html>`;

/** A link preview: a sheet with its title, the stack drawing and a title block. */
const preview = (title: string, sheet: string, name: string) =>
  page(
    1200,
    630,
    `<div class="frame"></div>
    <div style="position:absolute; left:84px; top:96px; width:660px">
      <div class="label" style="font-size:20px"><span class="accent">${sheet}</span> · ${name}</div>
      <div class="title" style="font-size:84px; margin-top:22px">${title}</div>
    </div>
    <div style="position:absolute; right:70px; top:56px">${stack(380)}</div>
    <div class="block" style="left:84px; bottom:70px; width:520px">
      <div><span class="label" style="font-size:13px">Project</span><b>Orkide</b></div>
      <div><span class="label" style="font-size:13px">Dwg no.</span><b class="accent">${sheet}</b></div>
    </div>`
  );

const browser = await chromium.launch();
const shoot = async (
  file: string,
  html: string,
  width: number,
  height: number
) => {
  const tab = await browser.newPage({ viewport: { height, width } });
  await tab.setContent(html, { waitUntil: "networkidle" });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: path.join(incoming, file) });
  await tab.close();
};

await mkdir(incoming, { recursive: true });
await writeFile(path.join(incoming, "favicon.svg"), favicon(64));
await shoot("favicon.png", page(1024, 1024, favicon(1024)), 1024, 1024);
await shoot(
  "app-icon.png",
  page(
    1024,
    1024,
    `<div class="frame"></div><div style="display:grid; place-items:center; width:1024px; height:1024px">${mark(720, 1.4)}</div>`
  ),
  1024,
  1024
);
await shoot(
  "og-default.png",
  preview("Every product starts from these drawings.", "G-001", "Cover sheet"),
  1200,
  630
);
await shoot(
  "og-blog.png",
  preview("Writing", "G-002", "Drawing index"),
  1200,
  630
);
await shoot("og-portfolio.png", preview("Work", "G-003", "Plates"), 1200, 630);
await shoot(
  "email-header.png",
  page(
    1200,
    300,
    `<div class="frame"></div>
    <div style="position:absolute; left:84px; top:50%; transform:translateY(-50%); display:flex; align-items:center; gap:28px">
      ${mark(120, 1.6)}<span class="word" style="font-size:64px">Orkide</span>
    </div>
    <div class="label" style="position:absolute; right:84px; top:50%; transform:translateY(-50%); font-size:20px"><span class="accent">G-001</span> · Cover sheet</div>`
  ),
  1200,
  300
);
await browser.close();
process.stdout.write(
  "brand: favicon, app icon, link previews and email header drawn\n"
);
