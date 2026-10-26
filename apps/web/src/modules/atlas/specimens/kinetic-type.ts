import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Type is the visual. Variable font axes stretch, gain weight and wave with time, scroll or cursor.",
    tr: "Görselin kendisi yazı. Değişken fontun eksenleri zamanla, kaydırmayla ya da imleçle esner, kalınlaşır ve dalgalanır.",
  },
  family: "motion",
  fit: "strong",
  id: "MO-03",
  name: { en: "Kinetic typography", tr: "Kinetik tipografi" },
  pairs: ["MO-01", "AE-01", "AE-05", "SN-03"],
  prompt:
    "Make the hero of [subject] pure kinetic type: a variable font with width and weight axes, each letter reacting to cursor distance and scroll velocity. No images. Split letters into spans, animate font-variation-settings, and keep the text selectable and readable at rest.",
  refs: [
    { label: "v-fonts.com", url: "https://v-fonts.com/" },
    {
      label: "CodePen: kinetic type",
      url: "https://codepen.io/search/pens?q=kinetic%20typography",
    },
  ],
  slug: "kinetic-type",
  tags: ["variable fonts", "font-variation-settings"],
} satisfies SpecimenInput;

/** The template's name, one span per letter; each letter's wave starts a little earlier (CSS). */
export const preview: Preview = (stage) => {
  const word = document.createElement("div");
  word.className = "st-kinetic-type-word";
  for (const [index, letter] of [..."ORKIDE"].entries()) {
    const span = document.createElement("span");
    span.textContent = letter;
    span.style.setProperty("--i", String(index));
    word.append(span);
  }
  stage.append(word);
};
