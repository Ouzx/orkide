import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Toggles, likes and buttons that answer every click with a tiny, specific motion.",
    tr: "Her tıklamaya küçük ve kendine özgü bir hareketle karşılık veren anahtarlar, beğeniler ve düğmeler.",
  },
  family: "motion",
  fit: "strong",
  id: "MO-05",
  name: { en: "Micro-interactions", tr: "Mikro etkileşimler" },
  pairs: ["MO-02", "MO-04", "AE-01", "SN-01"],
  prompt:
    "Give every control in [subject] a micro-interaction: button press depth, submit morphing into a checkmark, toggle with spring overshoot, like-burst. Use CSS + WAAPI with spring-like easing via linear(), each under 300ms.",
  refs: [
    { label: "Codrops", url: "https://tympanus.net/codrops/" },
    {
      label: "CodePen: micro-interactions",
      url: "https://codepen.io/search/pens?q=micro%20interaction",
    },
  ],
  slug: "micro-interactions",
  tags: ["WAAPI", "spring easing", "CSS transitions"],
} satisfies SpecimenInput;

/** A toggle that springs over, a heart that pops and a send button that becomes a check (CSS). */
export const preview: Preview = (stage) => {
  stage.insertAdjacentHTML(
    "beforeend",
    `<div class="st-micro-interactions-row" aria-hidden="true">
      <span class="st-micro-interactions-toggle"><i></i></span>
      <span class="st-micro-interactions-like">♥</span>
      <span class="st-micro-interactions-send"><em>Send</em><b>✓</b></span>
    </div>`
  );
};
