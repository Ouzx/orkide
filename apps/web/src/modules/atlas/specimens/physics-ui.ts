import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, fontStack, localPoint } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "heavy",
  desc: {
    en: "Navigation items are real objects. Throw them around and they bounce. Double-click to drop them again.",
    tr: "Gezinme öğeleri gerçek birer nesnedir. Fırlatınca sekerler; yeniden düşürmek için çift tıkla.",
  },
  drag: true,
  family: "play",
  fit: "good",
  hint: "drag",
  id: "PH-01",
  name: { en: "Physics UI", tr: "Fizik tabanlı arayüz" },
  pairs: ["AE-01", "MO-05", "SN-01", "PH-02"],
  prompt:
    "Turn the navigation of [subject] into physics objects: labeled circles that drop into a box, collide, and can be thrown with mouse or touch, using Matter.js. Clicking a body still navigates. Provide a normal link list for keyboard users and reduced motion.",
  refs: [
    { label: "Matter.js demos", url: "https://brm.io/matter-js/" },
    { label: "Rapier", url: "https://rapier.rs/" },
  ],
  slug: "physics-ui",
  tags: ["Matter.js", "Rapier", "collisions"],
} satisfies SpecimenInput;

interface Ball {
  fill: string;
  label: string;
  radius: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

const LABELS = ["Home", "Blog", "Plates", "Atlas", "Contact", "Feed", "Admin"];
const INK = "#1B1B1F";
const PAPER = "#FFFFFF";
const FILLS = [INK, "#FF5A36", "#2F45E8", PAPER];

/** Keeps a ball inside the box: the floor absorbs most of the bounce, the walls a little less. */
const bounce = (ball: Ball, width: number, height: number) => {
  if (ball.y > height - ball.radius) {
    ball.y = height - ball.radius;
    ball.vy *= -0.45;
    ball.vx *= 0.92;
  }
  if (ball.x < ball.radius) {
    ball.x = ball.radius;
    ball.vx *= -0.6;
  }
  if (ball.x > width - ball.radius) {
    ball.x = width - ball.radius;
    ball.vx *= -0.6;
  }
};

/** How much of an overlap `a` gives way: none when it is held, all of it when `b` is. */
const giveOf = (a: Ball, b: Ball, held: Ball | null): number => {
  if (a === held) {
    return 0;
  }
  if (b === held) {
    return 1;
  }
  return 0.5;
};

/** Pushes two overlapping balls apart and exchanges momentum along the line between them. */
const collide = (a: Ball, b: Ball, give: number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy) || 1;
  const overlap = a.radius + b.radius - distance;
  if (overlap <= 0) {
    return;
  }
  const nx = dx / distance;
  const ny = dy / distance;
  a.x -= nx * overlap * give;
  a.y -= ny * overlap * give;
  b.x += nx * overlap * (1 - give);
  b.y += ny * overlap * (1 - give);
  const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (closing < 0) {
    const impulse = -0.7 * closing;
    a.vx -= impulse * nx;
    a.vy -= impulse * ny;
    b.vx += impulse * nx;
    b.vy += impulse * ny;
  }
};

/** The site's sections drop into a box as balls you can throw; a double-click drops them again. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const font = fontStack("text");
  let balls: Ball[] = [];
  let held: Ball | null = null;
  const drop = () => {
    const base = Math.max(22, Math.min(view.width, view.height) * 0.075);
    balls = LABELS.map((label, index) => ({
      fill: FILLS[index % FILLS.length] ?? INK,
      label,
      radius: base + label.length * 1.4,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      x: view.width * (0.2 + 0.6 * Math.random()),
      y: -30 - index * 45,
    }));
  };
  drop();
  stage.addEventListener("pointerdown", (event) => {
    const { x, y } = localPoint(stage, event);
    held =
      balls.find((ball) => Math.hypot(ball.x - x, ball.y - y) < ball.radius) ??
      null;
    if (held) {
      stage.setPointerCapture(event.pointerId);
    }
  });
  stage.addEventListener("pointermove", (event) => {
    if (!held) {
      return;
    }
    const { x, y } = localPoint(stage, event);
    held.vx = (x - held.x) * 0.6;
    held.vy = (y - held.y) * 0.6;
    held.x = x;
    held.y = y;
  });
  const release = () => {
    held = null;
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("dblclick", drop);
  return () => {
    const { ctx, width, height } = view;
    for (const ball of balls) {
      if (ball !== held) {
        ball.vy += 0.35;
        ball.vx *= 0.995;
        ball.x += ball.vx;
        ball.y += ball.vy;
      }
      bounce(ball, width, height);
    }
    for (const [index, a] of balls.entries()) {
      for (const b of balls.slice(index + 1)) {
        collide(a, b, giveOf(a, b, held));
      }
    }
    ctx.fillStyle = "#FFD84D";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    for (const ball of balls) {
      ctx.fillStyle = ball.fill;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ball.fill === PAPER ? INK : PAPER;
      ctx.font = `600 ${Math.max(11, ball.radius * 0.34)}px ${font}`;
      ctx.fillText(ball.label, ball.x, ball.y);
    }
  };
};
