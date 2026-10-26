import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Torn paper, tape, halftone dots and grain. It looks handmade even though it is code.",
    tr: "Yırtık kâğıt, bant, raster noktaları ve film greni. Baştan sona kod olsa da el yapımı görünür.",
  },
  family: "aesthetic",
  fit: "good",
  id: "AE-03",
  name: { en: "Collage & texture", tr: "Kolaj ve doku" },
  pairs: ["MO-04", "MO-03", "SP-01", "GN-06"],
  prompt:
    "Give [subject] a collage look: torn-paper shapes, tape strips, halftone dots and film grain made with SVG filters and patterns, plus slightly rotated cut-out letters for headlines. All procedural, no scanned assets.",
  refs: [
    {
      label: "2026 trends: textures",
      url: "https://wannathis.one/blog/web-design-trends-2026",
    },
    {
      label: "Figma: collage trend",
      url: "https://www.figma.com/resource-library/web-design-trends/",
    },
  ],
  slug: "collage",
  tags: ["SVG filters", "feTurbulence", "halftone"],
} satisfies SpecimenInput;

/** The cut-out letters, each with the paper it was cut from. */
const LETTERS = [
  ["C", "#FFFFFF"],
  ["U", "#FFD43B"],
  ["T", "#FF8FB1"],
  ["+", "#FFFFFF"],
  ["P", "#9EE6C4"],
  ["A", "#FFFFFF"],
  ["S", "#FFD43B"],
  ["T", "#B9C6FF"],
  ["E", "#FFFFFF"],
] as const;

/** Paper, halftone, tape and grain in one SVG; the three pieces sway (CSS). */
export const preview: Preview = (stage) => {
  const letters = LETTERS.map(
    ([letter, paper], index) =>
      `<g transform="translate(${36 + index * 38},${204 + (index % 2) * 6}) rotate(${((index * 37) % 13) - 6})"><rect x="-15" y="-19" width="30" height="36" fill="${paper}"/><text x="0" y="10" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="26" fill="#141414">${letter}</text></g>`
  ).join("");
  stage.insertAdjacentHTML(
    "beforeend",
    `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="st-collage-dot" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="3.5" cy="3.5" r="2.3" fill="#D63B2F"/></pattern><filter id="st-collage-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.62"/></filter></defs><g class="st-collage-piece"><polygon points="38,40 212,26 224,152 48,168 44,120 30,96" fill="#2541B2"/><text x="64" y="112" font-family="Georgia, serif" font-style="italic" font-size="30" fill="#F4EAD5">issue nº 7</text></g><g class="st-collage-piece"><circle cx="300" cy="104" r="74" fill="#F4B6A8"/><circle cx="292" cy="98" r="70" fill="url(#st-collage-dot)"/></g><g class="st-collage-piece"><polygon points="14,182 386,170 390,238 18,252" fill="#141414"/>${letters}</g><rect x="176" y="14" width="74" height="22" fill="rgba(255,255,230,.62)" transform="rotate(-8 213 25)"/><rect width="400" height="300" filter="url(#st-collage-grain)" opacity=".55"/></svg>`
  );
};
