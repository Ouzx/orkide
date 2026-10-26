import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, fontStack } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "The logo is an algorithm. Tiles rotate and recolor, so every visitor sees a different variant.",
    tr: "Logo bir algoritmadır. Karolar döner ve renk değiştirir; böylece her ziyaretçi farklı bir varyant görür.",
  },
  family: "generative",
  fit: "strong",
  id: "GN-06",
  name: { en: "Generative identity", tr: "Üretken kimlik" },
  pairs: ["AE-05", "MO-02", "SP-04", "AE-01"],
  prompt:
    "Design a generative identity for [subject]: a 4×4 Truchet-tile mark from a seeded RNG in two brand colors that slowly mutates. Map seed to variant so stickers and social images can reuse an exact variant, and export it as SVG.",
  refs: [
    {
      label: "Truchet tiles",
      url: "https://en.wikipedia.org/wiki/Truchet_tiles",
    },
    { label: "Generative Artistry", url: "https://generativeartistry.com/" },
  ],
  slug: "generative-identity",
  tags: ["Truchet tiles", "seeded random", "SVG"],
} satisfies SpecimenInput;

interface Tile {
  /** Which of the two inks fills it. */
  ink: 0 | 1;
  /** Quarter turns it is heading to, and the turns it has eased to so far. */
  turn: number;
  turned: number;
}

/** Tiles per side of the mark. */
const SIDE = 4;
const INDIGO = "#3423A6";
const INKS = [INDIGO, "#FF4F79"] as const;

/** A 4 × 4 Truchet mark: every 0.45 s one tile turns (sometimes changing ink) and the variant number moves on. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const font = `600 11px ${fontStack("mono")}`;
  const tiles = Array.from({ length: SIDE * SIDE }, (): Tile => {
    const turn = Math.floor(Math.random() * 4);
    return { ink: Math.random() < 0.5 ? 0 : 1, turn, turned: turn };
  });
  let last = -1;
  let seed = 4211;
  return (t) => {
    if (t - last > 0.45) {
      last = t;
      const tile = tiles[Math.floor(Math.random() * tiles.length)];
      if (tile) {
        tile.turn += 1;
        if (Math.random() < 0.3) {
          tile.ink = tile.ink === 0 ? 1 : 0;
        }
      }
      seed = (seed * 7 + 13) % 9973;
    }
    const { ctx, width, height } = view;
    ctx.fillStyle = "#F2EFFF";
    ctx.fillRect(0, 0, width, height);
    const mark = Math.min(width, height) * 0.6;
    const size = mark / SIDE;
    const left = (width - mark) / 2;
    const top = (height - mark) / 2 - 10;
    for (const [index, tile] of tiles.entries()) {
      tile.turned += (tile.turn - tile.turned) * 0.12;
      ctx.save();
      ctx.translate(
        left + (index % SIDE) * size + size / 2,
        top + Math.floor(index / SIDE) * size + size / 2
      );
      ctx.rotate((tile.turned * Math.PI) / 2);
      ctx.fillStyle = INKS[tile.ink];
      ctx.beginPath();
      ctx.moveTo(-size / 2, -size / 2);
      ctx.arc(-size / 2, -size / 2, size, 0, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = INDIGO;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.fillText(`variant #${seed}`, width / 2, top + mark + 20);
  };
};
