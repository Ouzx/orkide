import type { SpecimenInput } from "@orkide/validators/atlas";

import { track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "The cursor is a flashlight. A second layer appears only where you point.",
    tr: "İmleç bir el feneri. İkinci katman yalnızca gösterdiğin yerde belirir.",
  },
  family: "senses",
  fit: "strong",
  hint: "move",
  id: "SN-03",
  name: { en: "Cursor spotlight", tr: "İmleç spot ışığı" },
  pairs: ["GN-01", "MO-03", "AE-04", "GN-05"],
  prompt:
    "Hide a second layer in the hero of [subject] that only shows through a soft circular mask at the cursor (CSS mask-image driven by --x/--y variables). On touch, the spotlight follows the finger. Never put essential information only in the hidden layer.",
  refs: [
    { label: "Hakim El Hattab lab", url: "https://lab.hakim.se/" },
    {
      label: "CodePen: spotlight",
      url: "https://codepen.io/search/pens?q=spotlight%20cursor",
    },
  ],
  slug: "cursor-spotlight",
  tags: ["CSS mask", "radial-gradient", "pointer vars"],
} satisfies SpecimenInput;

/** Two layers; the lit one shows through a mask that eases after the pointer (--x, --y). */
export const preview: Preview = (stage) => {
  const layers = document.createElement("div");
  layers.className = "st-cursor-spotlight-layers";
  layers.setAttribute("aria-hidden", "true");
  layers.innerHTML =
    '<div class="st-cursor-spotlight-dark">Look<br>around</div><div class="st-cursor-spotlight-lit">Hidden<br>sheet<br>found</div>';
  stage.append(layers);
  const pointer = track(stage);
  let x = 0.5;
  let y = 0.5;
  return (t) => {
    const aim = pointer.at(t);
    x += (aim.x - x) * 0.2;
    y += (aim.y - y) * 0.2;
    layers.style.setProperty("--x", `${(x * 100).toFixed(1)}%`);
    layers.style.setProperty("--y", `${(y * 100).toFixed(1)}%`);
  };
};
