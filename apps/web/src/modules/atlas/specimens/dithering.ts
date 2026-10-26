import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "1-bit ordered dithering turns smooth light into a crunchy, printed texture.",
    tr: "1 bitlik sıralı dithering, yumuşak ışığı baskı gibi pütürlü bir dokuya çevirir.",
  },
  family: "generative",
  fit: "strong",
  hint: "move",
  id: "GN-07",
  name: { en: "Dithering", tr: "Dithering" },
  pairs: ["AE-06", "MO-01", "SP-03", "AE-05"],
  prompt:
    "Give [subject] a 1-bit dithered look: render a lit sphere (or the hero image) at low resolution, apply a 4×4 Bayer ordered dither in two ink colors, and upscale with nearest-neighbor. The light follows the cursor.",
  refs: [
    {
      label: "Ditherpunk (Surma)",
      url: "https://surma.dev/things/ditherpunk/",
    },
    {
      label: "CodePen: dithering",
      url: "https://codepen.io/search/pens?q=dithering",
    },
  ],
  slug: "dithering",
  tags: ["Bayer matrix", "ImageData", "pixel art"],
} satisfies SpecimenInput;

/** The 4×4 Bayer threshold matrix, row by row. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const WIDTH = 160;
const HEIGHT = 120;
const INK = [255, 232, 205] as const;
const PAPER = [26, 22, 52] as const;

/** A sphere lit from the pointer, dithered at 160 × 120 and scaled up without smoothing. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const pointer = track(stage);
  const buffer = document.createElement("canvas");
  buffer.width = WIDTH;
  buffer.height = HEIGHT;
  const plate = buffer.getContext("2d");
  if (!plate) {
    throw new Error("Canvas 2D is unavailable");
  }
  const image = plate.createImageData(WIDTH, HEIGHT);
  return (t) => {
    const light = pointer.at(t);
    const lx = (light.x - 0.5) * 2;
    const ly = (light.y - 0.5) * 2;
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const u = (x - WIDTH / 2) / (HEIGHT * 0.36);
        const v = (y - HEIGHT / 2) / (HEIGHT * 0.36);
        const q = u * u + v * v;
        const lit =
          q < 1
            ? Math.max(0, (u * lx + v * ly) * 0.8 + Math.sqrt(1 - q) * 0.7) *
                0.85 +
              0.04
            : 0.14 + 0.1 * Math.sin(x * 0.09 + t * 2) * Math.sin(y * 0.06);
        const threshold = ((BAYER[(y % 4) * 4 + (x % 4)] ?? 0) + 0.5) / 16;
        const [red, green, blue] = lit > threshold ? INK : PAPER;
        const at = (y * WIDTH + x) * 4;
        image.data[at] = red;
        image.data[at + 1] = green;
        image.data[at + 2] = blue;
        image.data[at + 3] = 255;
      }
    }
    plate.putImageData(image, 0, 0);
    const { ctx, width, height } = view;
    const scale = Math.max(width / WIDTH, height / HEIGHT);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      buffer,
      (width - WIDTH * scale) / 2,
      (height - HEIGHT * scale) / 2,
      WIDTH * scale,
      HEIGHT * scale
    );
  };
};
