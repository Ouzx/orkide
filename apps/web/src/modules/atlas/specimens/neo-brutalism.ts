import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Thick borders, hard shadows, loud color, zero polish, all on purpose.",
    tr: "Kalın kenarlıklar, sert gölgeler, bağıran renkler, sıfır cila; hepsi bilerek.",
  },
  family: "aesthetic",
  fit: "strong",
  id: "AE-01",
  name: { en: "Neo-brutalism", tr: "Neo-brütalizm" },
  pairs: ["MO-03", "PH-01", "MO-05", "PH-04"],
  prompt:
    "Design [subject] in neo-brutalist style: one loud background color, 3px black borders, hard offset shadows, oversized system type, a ticker marquee, and buttons that physically press in. Keep contrast at WCAG AA.",
  refs: [
    { label: "Brutalist Websites", url: "https://brutalistwebsites.com/" },
    {
      label: "Figma: 2026 trends",
      url: "https://www.figma.com/resource-library/web-design-trends/",
    },
  ],
  slug: "neo-brutalism",
  tags: ["hard shadows", "marquee", "system fonts"],
} satisfies SpecimenInput;

/** Four copies, so sliding by half loops without a seam. */
const TICKER = "SHIP IT ✱ EDGE ONLY ✱ NO BUILD SERVER ✱ ".repeat(4);

/** A ticker, a shouting headline and a button that presses into its shadow (CSS). */
export const preview: Preview = (stage) => {
  const poster = document.createElement("div");
  poster.className = "st-neo-brutalism-poster";
  poster.setAttribute("aria-hidden", "true");
  poster.innerHTML = `<div class="st-neo-brutalism-ticker"><span>${TICKER}</span></div><div class="st-neo-brutalism-headline">BIG<br>LOUD<br>SITES</div><span class="st-neo-brutalism-button">CLONE →</span>`;
  stage.append(poster);
};
