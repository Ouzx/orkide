import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "A verlet rope hangs from the cursor and swings with momentum.",
    tr: "İmleçten sarkan bir verlet ipi, momentumuyla salınır.",
  },
  family: "play",
  fit: "strong",
  hint: "move",
  id: "PH-04",
  name: { en: "Elastic cursor", tr: "Elastik imleç" },
  pairs: ["AE-01", "GN-04", "MO-03", "AE-02"],
  prompt:
    "Attach an elastic verlet rope to the cursor in [subject]: 20–30 segments with gravity and damping, a tapered stroke in [palette]. Hide it on touch devices and under reduced motion.",
  refs: [
    { label: "Hakim El Hattab lab", url: "https://lab.hakim.se/" },
    {
      label: "CodePen: verlet rope",
      url: "https://codepen.io/search/pens?q=verlet%20rope",
    },
  ],
  slug: "elastic-cursor",
  tags: ["verlet integration", "Canvas"],
} satisfies SpecimenInput;

/** A point of the rope, with where it was a step ago (verlet keeps velocity implicit). */
interface Knot {
  px: number;
  py: number;
  x: number;
  y: number;
}

const KNOTS = 26;

/** Moves two neighbours back to one segment apart; a pinned first knot stays where it is. */
const pull = (a: Knot, b: Knot, segment: number, pinned: boolean) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy) || 1;
  const stretch = (distance - segment) / distance;
  const give = pinned ? 0 : 0.5;
  a.x += dx * stretch * give;
  a.y += dy * stretch * give;
  b.x -= dx * stretch * (1 - give);
  b.y -= dy * stretch * (1 - give);
};

/** 26 knots under gravity hang from the pointer, drawn as a tapered stroke in two alternating colours. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const pointer = track(stage);
  const knot = (): Knot => ({
    px: view.width / 2,
    py: view.height / 2,
    x: view.width / 2,
    y: view.height / 2,
  });
  const head = knot();
  const tail = Array.from({ length: KNOTS - 1 }, knot);
  return (t) => {
    const { ctx, width, height } = view;
    const aim = pointer.at(t);
    head.x = aim.x * width;
    head.y = aim.y * height;
    for (const point of tail) {
      const vx = (point.x - point.px) * 0.96;
      const vy = (point.y - point.py) * 0.96;
      point.px = point.x;
      point.py = point.y;
      point.x += vx;
      point.y += vy + 0.3;
    }
    const segment = Math.min(width, height) * 0.028;
    for (let pass = 0; pass < 6; pass += 1) {
      let anchor = head;
      for (const point of tail) {
        pull(anchor, point, segment, anchor === head);
        anchor = point;
      }
    }
    ctx.fillStyle = "#FF5A36";
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = "round";
    let from = head;
    for (const [index, point] of tail.entries()) {
      const order = index + 1;
      ctx.strokeStyle = order % 2 === 1 ? "#1A1A1A" : "#FFF3E8";
      ctx.lineWidth = (1 - order / KNOTS) * 22 + 2;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      from = point;
    }
    ctx.fillStyle = "#1A1A1A";
    ctx.beginPath();
    ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
    ctx.fill();
  };
};
