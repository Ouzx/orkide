import type { SpecimenInput } from "@orkide/validators/atlas";

import { track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Cards lean toward the cursor and catch a glare that slides across them.",
    tr: "Kartlar imlece doğru eğilir ve üzerlerinde kayan bir parıltı yakalar.",
  },
  family: "spatial",
  fit: "strong",
  hint: "move",
  id: "SP-04",
  name: { en: "Tilt & holo cards", tr: "Eğilen holografik kartlar" },
  pairs: ["AE-02", "GN-06", "SN-02", "MO-05"],
  prompt:
    "Make the cards of [subject] tilt in 3D toward the cursor with a holographic glare that follows the pointer. CSS perspective and transforms driven by pointer position, smoothed with lerp, flat on touch and reduced motion.",
  refs: [
    {
      label: "MDN: perspective",
      url: "https://developer.mozilla.org/en-US/docs/Web/CSS/perspective",
    },
    {
      label: "CodePen: holo cards",
      url: "https://codepen.io/search/pens?q=holographic%20card",
    },
  ],
  slug: "tilt-cards",
  tags: ["CSS 3D transforms", "perspective"],
} satisfies SpecimenInput;

/** A pass that leans toward the pointer (eased), with a glare that follows it. */
export const preview: Preview = (stage) => {
  const card = document.createElement("div");
  card.className = "st-tilt-cards-card";
  card.setAttribute("aria-hidden", "true");
  card.innerHTML =
    '<div class="st-tilt-cards-shine"></div><em>No. G-001</em><b>ORKIDE<br>TEMPLATE</b><span>DERIVE PASS</span>';
  stage.append(card);
  const pointer = track(stage);
  let rotateX = 0;
  let rotateY = 0;
  let glareX = 0.5;
  let glareY = 0.5;
  return (t) => {
    const { x, y } = pointer.at(t);
    rotateX += ((y - 0.5) * -24 - rotateX) * 0.12;
    rotateY += ((x - 0.5) * 30 - rotateY) * 0.12;
    glareX += (x - glareX) * 0.12;
    glareY += (y - glareY) * 0.12;
    card.style.transform = `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    card.style.setProperty("--mx", `${(glareX * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(glareY * 100).toFixed(1)}%`);
  };
};
