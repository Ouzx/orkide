import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "The page is a sequence of scenes. Scrolling scrubs each scene, so the reader sets the pace.",
    tr: "Sayfa art arda dizilmiş sahnelerden oluşur. Kaydırdıkça her sahne ileri geri oynar; tempoyu okuyan belirler.",
  },
  family: "motion",
  fit: "strong",
  id: "MO-01",
  name: { en: "Scroll-driven story", tr: "Kaydırmayla ilerleyen hikâye" },
  pairs: ["MO-03", "AE-05", "GN-07", "SP-03"],
  prompt:
    "Build [subject] as a scroll-driven story in 5 pinned scenes. Use CSS scroll-timeline / view-timeline, with GSAP ScrollTrigger as fallback. Each scene carries one idea and one animation scrubbed by scroll. Add a progress rail, and keep a readable static layout under prefers-reduced-motion.",
  refs: [
    {
      label: "Scroll-driven demos",
      url: "https://scroll-driven-animations.style/",
    },
    { label: "GSAP showcase", url: "https://gsap.com/showcase/" },
    {
      label: "Awwwards interactive",
      url: "https://www.awwwards.com/inspiration_search/web-interactive/",
    },
  ],
  slug: "scroll-story",
  tags: ["CSS scroll-timeline", "GSAP ScrollTrigger", "sticky"],
} satisfies SpecimenInput;

/** A phone scrolling through the stack's three scenes while its rail fills (CSS). */
export const preview: Preview = (stage) => {
  stage.insertAdjacentHTML(
    "beforeend",
    `<div class="st-scroll-story-phone" aria-hidden="true">
      <div class="st-scroll-story-rail"><i></i></div>
      <div class="st-scroll-story-track">
        <div><b>01</b><span>Request</span></div>
        <div><b>02</b><span>Render</span></div>
        <div><b>03</b><span>Paint</span></div>
      </div>
    </div>`
  );
};
