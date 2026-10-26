import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "Frosted panels float over moving color, with bright edges like real glass.",
    tr: "Buzlu paneller hareketli renklerin üzerinde süzülür; kenarları gerçek cam gibi parlar.",
  },
  family: "aesthetic",
  fit: "good",
  id: "AE-04",
  name: { en: "Liquid glass", tr: "Sıvı cam" },
  pairs: ["GN-01", "GN-04", "MO-02", "SN-03"],
  prompt:
    "Build the UI of [subject] as liquid glass: translucent panels with backdrop-filter blur and saturation over slowly moving color blobs, bright 1px edge highlights, and readable text contrast at every position. Check it on a low-end GPU.",
  refs: [
    {
      label: "MDN: backdrop-filter",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter",
    },
    {
      label: "CodePen: liquid glass",
      url: "https://codepen.io/search/pens?q=liquid%20glass",
    },
  ],
  slug: "liquid-glass",
  tags: ["backdrop-filter", "layered blur"],
} satisfies SpecimenInput;

/** A frosted panel over three drifting blobs (CSS). */
export const preview: Preview = (stage) => {
  const scene = document.createElement("div");
  scene.className = "st-liquid-glass-scene";
  scene.setAttribute("aria-hidden", "true");
  scene.innerHTML =
    '<i class="st-liquid-glass-blob st-liquid-glass-a"></i><i class="st-liquid-glass-blob st-liquid-glass-b"></i><i class="st-liquid-glass-blob st-liquid-glass-c"></i><div class="st-liquid-glass-panel"><small>Now deploying</small><strong>orkide-web</strong><span>Edge · 30 s left</span></div>';
  stage.append(scene);
};
