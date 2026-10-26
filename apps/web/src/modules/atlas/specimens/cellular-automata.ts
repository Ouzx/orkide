import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "Simple rules grow complex patterns. Hover to plant new cells.",
    tr: "Basit kurallardan karmaşık desenler doğar. Yeni hücreler ekmek için imleci üzerinde gezdir.",
  },
  family: "generative",
  fit: "strong",
  hint: "hover",
  id: "GN-03",
  name: { en: "Cellular automata", tr: "Hücresel otomatlar" },
  pairs: ["AE-06", "GN-05", "PH-03", "SN-01"],
  prompt:
    "Use a cellular automaton as the living background of [subject]: Conway’s Life or reaction-diffusion on a coarse grid, fading trails, reseeding when it stagnates, and the cursor planting cells. Canvas 2D, ~10 simulation steps per second, 60fps drawing.",
  refs: [
    { label: "LifeWiki", url: "https://conwaylife.com/" },
    {
      label: "Reaction-diffusion tutorial",
      url: "https://www.karlsims.com/rd.html",
    },
  ],
  slug: "cellular-automata",
  tags: ["Canvas 2D", "Game of Life", "reaction-diffusion"],
} satisfies SpecimenInput;

const COLUMNS = 56;
const ROWS = 42;

/** A cell's index on the grid, which wraps around at its edges. */
const cellAt = (x: number, y: number): number =>
  ((y + ROWS) % ROWS) * COLUMNS + ((x + COLUMNS) % COLUMNS);

/** A fresh soup with about 28% of the cells alive. */
const soup = (): Uint8Array =>
  Uint8Array.from({ length: COLUMNS * ROWS }, () =>
    Math.random() < 0.28 ? 1 : 0
  );

/** The next generation under Conway's rules: born with 3 neighbours, survives with 2 or 3. */
const step = (cells: Uint8Array): Uint8Array => {
  const next = new Uint8Array(cells.length);
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLUMNS; x += 1) {
      let around = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx !== 0 || dy !== 0) {
            around += cells[cellAt(x + dx, y + dy)] ?? 0;
          }
        }
      }
      const index = y * COLUMNS + x;
      next[index] =
        around === 3 || (around === 2 && cells[index] === 1) ? 1 : 0;
    }
  }
  return next;
};

/** Sprinkles live cells over the 5 × 5 patch under the pointer. */
const plant = (cells: Uint8Array, x: number, y: number) => {
  const column = Math.floor(x * COLUMNS);
  const row = Math.floor(y * ROWS);
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      if (Math.random() < 0.45) {
        cells[cellAt(column + dx, row + dy)] = 1;
      }
    }
  }
};

/** Life steps about ten times a second and reseeds after 280 generations; dead cells leave a blue trail. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const pointer = track(stage);
  const glow = new Float32Array(COLUMNS * ROWS);
  let cells = soup();
  let generation = 0;
  let last = -1;
  return (t) => {
    if (t - last > 0.09) {
      last = t;
      cells = step(cells);
      generation += 1;
      if (generation > 280) {
        cells = soup();
        generation = 0;
      }
      if (pointer.inside) {
        plant(cells, pointer.x, pointer.y);
      }
    }
    const { ctx, width, height } = view;
    ctx.fillStyle = "#08160F";
    ctx.fillRect(0, 0, width, height);
    const cellWidth = width / COLUMNS;
    const cellHeight = height / ROWS;
    for (const [index, alive] of cells.entries()) {
      const before = glow[index] ?? 0;
      const level = alive === 1 ? Math.min(before + 0.15, 1) : before * 0.9;
      glow[index] = level;
      if (level > 0.03) {
        ctx.fillStyle =
          alive === 1
            ? `rgba(120,255,170,${0.45 + level * 0.55})`
            : `rgba(40,140,255,${level * 0.7})`;
        ctx.fillRect(
          (index % COLUMNS) * cellWidth + 0.5,
          Math.floor(index / COLUMNS) * cellHeight + 0.5,
          cellWidth - 1,
          cellHeight - 1
        );
      }
    }
  };
};
