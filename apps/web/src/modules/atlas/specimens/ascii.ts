import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, fontStack, track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "Everything is drawn with characters. A plasma field turns into living text.",
    tr: "Her şey karakterlerle çizilir. Bir plazma alanı canlı bir metne dönüşür.",
  },
  family: "generative",
  fit: "strong",
  hint: "move",
  id: "GN-05",
  name: { en: "ASCII rendering", tr: "ASCII ile çizim" },
  pairs: ["AE-06", "GN-03", "MO-03", "SN-03"],
  prompt:
    "Render the hero of [subject] in ASCII: a monospace character grid where a plasma/noise field maps to a density ramp, the cursor sends a ripple, and the headline is carved out of the field. Draw with Canvas fillText one row at a time.",
  refs: [
    { label: "play.core", url: "https://play.ertdfgcvb.xyz/" },
    {
      label: "CodePen: ASCII",
      url: "https://codepen.io/search/pens?q=ascii%20animation",
    },
  ],
  slug: "ascii",
  tags: ["Canvas text", "monospace", "density ramp"],
} satisfies SpecimenInput;

/** From empty to dense: the field's value picks a character. */
const RAMP = " .,:;-=+*#%@";
/** The character size and row height, in CSS pixels. */
const SIZE = 11;

/** Three sine waves and a ring around the pointer, written row by row with a density ramp. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const pointer = track(stage);
  const font = `${SIZE}px ${fontStack("mono")}`;
  return (t) => {
    const { ctx, width, height } = view;
    ctx.fillStyle = "#0D0D0D";
    ctx.fillRect(0, 0, width, height);
    ctx.font = font;
    ctx.textBaseline = "top";
    const columns = Math.ceil(width / (ctx.measureText("@").width || 6.6));
    const rows = Math.ceil(height / SIZE);
    const ripple = pointer.at(t);
    for (let y = 0; y < rows; y += 1) {
      let line = "";
      for (let x = 0; x < columns; x += 1) {
        const u = x / columns;
        const v = y / rows;
        const distance = Math.hypot((u - ripple.x) * 1.5, v - ripple.y);
        const field =
          (Math.sin(u * 9 + t) +
            Math.sin(v * 7 - t * 1.3) +
            Math.sin((u + v) * 6 + t * 0.7) +
            Math.cos(distance * 16 - t * 3) * 1.5 +
            4.5) /
          9;
        line += RAMP.charAt(
          Math.max(
            0,
            Math.min(RAMP.length - 1, Math.trunc(field * RAMP.length))
          )
        );
      }
      ctx.fillStyle = `hsl(${28 + (y / rows) * 24},100%,${56 + (y % 2) * 5}%)`;
      ctx.fillText(line, 0, y * SIZE);
    }
  };
};
