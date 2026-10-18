/**
 * Draws the brand originals from the skin (packages/ui tokens and fonts) into `design/incoming/`:
 * the favicon and app icon (a knob seen from above), the link-preview images (the front panel)
 * and the email header (the device's top edge). `pnpm --filter @orkide/web media` then turns them
 * into the served files. A product with its own skin edits the markup below, or drops its own
 * originals into `design/incoming/` instead.
 *
 * Run: `pnpm --filter @orkide/web brand` (renders with Playwright's Chromium; fonts come from
 * Google Fonts, so it needs the network).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { tokens } from "@orkide/ui/tokens/tokens";
import { chromium } from "@playwright/test";

const incoming = path.resolve(import.meta.dirname, "../../../design/incoming");
const { light } = tokens.color;
const { dark } = tokens.color;

/** A knob from above: graphite skirt, signal cap, ink pointer. Reads at 16 px. */
const knob = (size: number, ticks: boolean) => {
  const marks = ticks
    ? Array.from({ length: 28 }, (_, step) => {
        const angle = ((-135 + step * 10) * Math.PI) / 180;
        const inner = step % 9 === 0 ? 40 : 43;
        const lit = step <= 9;
        return `<line x1="${50 + Math.sin(angle) * inner}" y1="${50 - Math.cos(angle) * inner}" x2="${50 + Math.sin(angle) * 47}" y2="${50 - Math.cos(angle) * 47}" stroke="${lit ? light.signal : light["ink-2"]}" stroke-width="1.6" stroke-linecap="round"/>`;
      }).join("")
    : "";
  const skirt = ticks ? 36 : 48;
  const cap = ticks ? 25 : 33;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <defs><radialGradient id="cap" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="${light["signal-glint"]}"/><stop offset="0.6" stop-color="${light.signal}"/><stop offset="1" stop-color="${light["signal-deep"]}"/></radialGradient></defs>
  ${marks}
  <circle cx="50" cy="50" r="${skirt}" fill="${dark.case}"/>
  <circle cx="50" cy="50" r="${cap}" fill="url(#cap)"/>
  <rect x="${50 - cap * 0.12}" y="${50 - cap * 0.92}" width="${cap * 0.24}" height="${cap * 0.62}" rx="${cap * 0.12}" fill="${light["on-signal"]}" transform="rotate(-40 50 50)"/>
</svg>`;
};

/**
 * The favicon: the knob drawn for 16 px. A bigger cap and a longer pointer than the panel's knob,
 * and a hairline rim in the case colour so it stays visible on dark tab bars.
 */
const favicon = (
  size: number
) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <defs><radialGradient id="cap" cx="0.38" cy="0.3" r="0.85"><stop offset="0" stop-color="${light["signal-glint"]}"/><stop offset="0.55" stop-color="${light.signal}"/><stop offset="1" stop-color="${light["signal-deep"]}"/></radialGradient></defs>
  <circle cx="32" cy="32" r="31" fill="${dark.case}" stroke="${light.case}" stroke-width="2"/>
  <circle cx="32" cy="32" r="22.5" fill="url(#cap)"/>
  <rect x="28.75" y="11.5" width="6.5" height="18" rx="3.25" fill="${light["on-signal"]}" transform="rotate(-40 32 32)"/>
</svg>
`;

const fonts =
  "https://fonts.googleapis.com/css2?family=Doto:wght,ROND@900,100&family=Saira:wdth,wght@75..125,600..900&display=block";

const page = (width: number, height: number, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><link rel="stylesheet" href="${fonts}"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${width}px; height: ${height}px; overflow: hidden; background: ${light.case}; color: ${light.ink}; font-family: Saira, sans-serif; }
  .eng { font-weight: 600; font-stretch: 85%; letter-spacing: 0.16em; text-transform: uppercase; color: ${light["ink-2"]}; }
  .panel { position: absolute; border-radius: 40px; background: linear-gradient(160deg, ${light.case}, ${light.panel}); box-shadow: inset 0 3px 0 ${light.hl}, inset 0 -4px 0 ${light.deep}, 0 40px 70px -40px ${light.sh}; }
  .screen { border-radius: 20px; background: ${light.screen}; box-shadow: inset 0 4px 14px ${light.shade}, 0 0 0 8px ${light.deep}; color: ${light.led}; font-family: Doto, monospace; font-weight: 900; text-shadow: 0 0 18px ${light["led-glow"]}; }
  .lamp { width: 14px; height: 14px; border-radius: 50%; background: ${light.ok}; box-shadow: 0 0 14px ${light.ok}; }
  .brand { font-weight: 900; font-stretch: 125%; letter-spacing: 0.04em; }
</style></head><body>${body}</body></html>`;

/** The front panel with a two-line display: the link preview for a section of the site. */
const preview = (line: string, sub: string) =>
  page(
    1200,
    630,
    `<div class="panel" style="inset: 48px">
      <div style="position:absolute; top:34px; left:44px; display:flex; gap:12px; align-items:center"><span class="lamp"></span><span class="eng" style="font-size:18px">PWR</span></div>
      <div style="position:absolute; top:30px; right:46px" class="eng" ><span style="font-size:18px">${sub}</span></div>
      <div class="screen" style="position:absolute; left:44px; top:84px; width:720px; height:400px; padding:40px 44px">
        <div style="font-size:30px; opacity:.8">ORKIDE · MODEL 26</div>
        <div style="font-size:104px; line-height:1.05; margin-top:34px">${line}</div>
      </div>
      <div style="position:absolute; right:58px; top:150px">${knob(250, true)}</div>
    </div>`
  );

const browser = await chromium.launch();
const shoot = async (
  file: string,
  html: string,
  width: number,
  height: number,
  transparent = false
) => {
  const tab = await browser.newPage({ viewport: { height, width } });
  await tab.setContent(html, { waitUntil: "networkidle" });
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({
    omitBackground: transparent,
    path: path.join(incoming, file),
  });
  await tab.close();
};

await mkdir(incoming, { recursive: true });
await writeFile(path.join(incoming, "favicon.svg"), favicon(64));
await shoot(
  "favicon.png",
  page(1024, 1024, favicon(1024)).replace(
    `background: ${light.case}`,
    "background: transparent"
  ),
  1024,
  1024,
  true
);
await shoot(
  "app-icon.png",
  page(
    1024,
    1024,
    `<div style="display:grid; place-items:center; width:1024px; height:1024px">${knob(900, true)}</div>`
  ),
  1024,
  1024
);
await shoot(
  "og-default.png",
  preview("ENGINEERING,<br>CRAFTED.", "Software engineer · Builder"),
  1200,
  630
);
await shoot(
  "og-blog.png",
  preview("§1 BLOG", "Notes on engineering"),
  1200,
  630
);
await shoot(
  "og-portfolio.png",
  preview("§2 WORK", "Selected projects"),
  1200,
  630
);
await shoot(
  "email-header.png",
  page(
    1200,
    300,
    `<div class="panel" style="inset: 30px 40px">
      <div style="position:absolute; left:46px; top:50%; transform:translateY(-50%); display:flex; align-items:baseline; gap:18px"><span class="brand" style="font-size:64px">ORKIDE</span><span class="eng" style="font-size:20px">MODEL 26</span></div>
      <div style="position:absolute; right:150px; top:50%; transform:translateY(-50%); display:flex; gap:12px; align-items:center"><span class="lamp"></span><span class="eng" style="font-size:18px">PWR</span></div>
      <div style="position:absolute; right:30px; top:50%; transform:translateY(-50%)">${knob(110, false)}</div>
    </div>`
  ),
  1200,
  300
);
await browser.close();
process.stdout.write(
  "brand: favicon, app icon, link previews and email header drawn\n"
);
