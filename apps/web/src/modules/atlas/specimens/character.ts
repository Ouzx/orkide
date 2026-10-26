import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "A small mascot with squash, stretch and blinks gives the page a personality.",
    tr: "Ezilip esneyen, göz kırpan küçük bir maskot sayfaya kişilik katar.",
  },
  family: "motion",
  fit: "good",
  id: "MO-04",
  name: { en: "Character animation", tr: "Karakter animasyonu" },
  pairs: ["MO-05", "PH-02", "AE-02", "AE-03"],
  prompt:
    "Design an original SVG mascot for [subject] and animate it: squash-and-stretch idle bounce, random blinks, and a reaction when the user hovers the main button. Pure SVG plus CSS/WAAPI, no external assets.",
  refs: [
    { label: "Rive community", url: "https://rive.app/community/" },
    { label: "LottieFiles", url: "https://lottiefiles.com/" },
  ],
  slug: "character",
  tags: ["SVG", "CSS keyframes", "Rive / Lottie"],
} satisfies SpecimenInput;

/** A drawn blob that hops with squash and stretch over its shadow and blinks now and then (CSS). */
export const preview: Preview = (stage) => {
  stage.insertAdjacentHTML(
    "beforeend",
    `<svg viewBox="0 0 200 150" aria-hidden="true">
      <ellipse class="st-character-shadow" cx="100" cy="134" rx="36" ry="6" fill="#B23A5F"/>
      <g class="st-character-body">
        <path d="M62 132 C58 96 72 62 100 62 C128 62 142 96 138 132 Z" fill="#FF5C8A"/>
        <circle cx="86" cy="94" r="7" fill="#fff"/>
        <circle cx="114" cy="94" r="7" fill="#fff"/>
        <g class="st-character-eye"><circle cx="87" cy="95" r="3.4" fill="#2A0E19"/></g>
        <g class="st-character-eye"><circle cx="115" cy="95" r="3.4" fill="#2A0E19"/></g>
        <path d="M92 110 Q100 117 108 110" stroke="#2A0E19" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="77" cy="108" rx="6" ry="3.5" fill="#FF9DB8"/>
        <ellipse cx="123" cy="108" rx="6" ry="3.5" fill="#FF9DB8"/>
      </g>
    </svg>`
  );
};
