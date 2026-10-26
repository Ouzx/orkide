import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Strict grid, giant numerals, one red block. Order is the aesthetic.",
    tr: "Katı bir ızgara, dev rakamlar, tek bir kırmızı blok. Estetiğin kendisi düzen.",
  },
  family: "aesthetic",
  fit: "strong",
  id: "AE-05",
  name: { en: "Swiss editorial", tr: "İsviçre tarzı editoryal" },
  pairs: ["MO-01", "MO-03", "GN-06", "PH-03"],
  prompt:
    "Design [subject] in modern Swiss style: a strict 12-column grid, huge numerals and flush-left type, one red accent block that wipes in on scroll, generous white space, no decoration.",
  refs: [
    { label: "Fonts In Use", url: "https://fontsinuse.com/" },
    { label: "Typographica", url: "https://typographica.org/" },
  ],
  slug: "swiss-editorial",
  tags: ["CSS grid", "display type", "asymmetry"],
} satisfies SpecimenInput;

/** A six-column page: a giant numeral, a red block that wipes in (CSS), a contents list. */
export const preview: Preview = (stage) => {
  const page = document.createElement("div");
  page.className = "st-swiss-editorial-page";
  page.setAttribute("aria-hidden", "true");
  page.innerHTML =
    '<span class="st-swiss-editorial-numeral">26</span><span class="st-swiss-editorial-block"></span><p>Posts<br>Plates<br>Atlas</p><small><span>Template</span><span>Vol. 26</span></small>';
  stage.append(page);
};
