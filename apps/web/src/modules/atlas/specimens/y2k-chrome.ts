import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Liquid chrome type, sparkles and candy gradients, straight out of 2001.",
    tr: "Sıvı krom harfler, ışıltılar ve şeker renkli gradyanlar; sanki doğrudan 2001'den gelmiş.",
  },
  family: "aesthetic",
  fit: "strong",
  id: "AE-02",
  name: { en: "Y2K chrome", tr: "Y2K krom" },
  pairs: ["SP-04", "GN-02", "MO-04", "PH-02"],
  prompt:
    "Style [subject] with Y2K energy: an animated liquid-chrome headline (gradient + background-clip), candy-colored blurred blobs, sparkle glyphs and rounded pill UI. Fun but legible, no stock clipart.",
  refs: [
    {
      label: "Figma: 2026 trends",
      url: "https://www.figma.com/resource-library/web-design-trends/",
    },
    {
      label: "CodePen: chrome text",
      url: "https://codepen.io/search/pens?q=chrome%20text",
    },
  ],
  slug: "y2k-chrome",
  tags: ["background-clip text", "gradients", "blur blobs"],
} satisfies SpecimenInput;

/** Chrome lettering over two candy blobs, with three sparkles (CSS). */
export const preview: Preview = (stage) => {
  const scene = document.createElement("div");
  scene.className = "st-y2k-chrome-scene";
  scene.setAttribute("aria-hidden", "true");
  scene.innerHTML =
    '<i class="st-y2k-chrome-blob st-y2k-chrome-b1"></i><i class="st-y2k-chrome-blob st-y2k-chrome-b2"></i><div class="st-y2k-chrome-title">Y2K<br>4EVER</div><span class="st-y2k-chrome-spark st-y2k-chrome-s1">✦</span><span class="st-y2k-chrome-spark st-y2k-chrome-s2">✦</span><span class="st-y2k-chrome-spark st-y2k-chrome-s3">✧</span>';
  stage.append(scene);
};
