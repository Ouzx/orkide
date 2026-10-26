import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Elements glide between layouts instead of jumping when you filter, sort or open something.",
    tr: "Filtreleyince, sıralayınca ya da bir şey açınca öğeler bir yerleşimden ötekine sıçramaz, süzülerek geçer.",
  },
  family: "motion",
  fit: "strong",
  id: "MO-02",
  name: { en: "Morphing layouts", tr: "Dönüşen yerleşimler" },
  pairs: ["MO-05", "AE-05", "AE-04", "SP-01"],
  prompt:
    "Build [subject] so every state change morphs: filtering a grid, opening a card into a detail view, switching pages. Use the View Transitions API with a view-transition-name per item and a FLIP fallback. Keep each transition under 400ms.",
  refs: [
    {
      label: "MDN: View Transitions",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API",
    },
    {
      label: "Chrome docs",
      url: "https://developer.chrome.com/docs/web-platform/view-transitions/",
    },
  ],
  slug: "morphing-layouts",
  tags: ["View Transitions API", "FLIP"],
} satisfies SpecimenInput;

/** A 2 × 2 grid that opens its first tile and lines the others up beneath it, then back (CSS). */
export const preview: Preview = (stage) => {
  stage.insertAdjacentHTML(
    "beforeend",
    '<div class="st-morphing-layouts-board" aria-hidden="true"><i></i><i></i><i></i><i></i></div>'
  );
};
