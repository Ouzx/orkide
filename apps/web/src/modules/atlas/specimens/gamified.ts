import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, fontStack, localPoint, starPath } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "The page hides a tiny game. Catch the stars to raise your score.",
    tr: "Sayfada küçük bir oyun saklı. Puanını artırmak için yıldızları yakala.",
  },
  family: "play",
  fit: "good",
  hint: "click",
  id: "PH-02",
  name: { en: "Gamified page", tr: "Oyunlaştırılmış sayfa" },
  pairs: ["MO-04", "PH-01", "AE-02", "SN-01"],
  prompt:
    "Hide a mini-game in [subject]: collectible items drift up, clicking pops them with particles, and the score unlocks something real (a discount code, a hidden section). Canvas game loop, works on touch, never blocks the main content.",
  refs: [
    { label: "Bruno Simon", url: "https://bruno-simon.com/" },
    { label: "neal.fun", url: "https://neal.fun/" },
  ],
  slug: "gamified",
  tags: ["Canvas", "game loop", "particles"],
} satisfies SpecimenInput;

interface Star {
  caught: boolean;
  phase: number;
  radius: number;
  vy: number;
  x: number;
  y: number;
}

interface Spark {
  life: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

const GOLD = "#FFE45C";

/** Fourteen sparks flying out of a caught star. */
const burst = (x: number, y: number): Spark[] =>
  Array.from({ length: 14 }, () => {
    const angle = Math.random() * 6.28;
    const speed = 1 + Math.random() * 3;
    return {
      life: 1,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      x,
      y,
    };
  });

/** Up to five stars rise through a twinkling sky; catching one bursts it and adds to the score. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const font = `700 14px ${fontStack("display")}`;
  const sky = Array.from(
    { length: 40 },
    () => [Math.random(), Math.random(), Math.random()] as const
  );
  let stars: Star[] = [];
  let sparks: Spark[] = [];
  let score = 0;
  let spawned = -1;
  stage.addEventListener("pointerdown", (event) => {
    const { x, y } = localPoint(stage, event);
    for (const star of stars) {
      if (
        !star.caught &&
        Math.hypot(star.x - x, star.y - y) < star.radius + 12
      ) {
        star.caught = true;
        score += 1;
        sparks.push(...burst(star.x, star.y));
      }
    }
  });
  return (t) => {
    const { ctx, width, height } = view;
    if (stars.length < 5 && t - spawned > 0.6) {
      spawned = t;
      stars.push({
        caught: false,
        phase: Math.random() * 6,
        radius: 10 + Math.random() * 7,
        vy: -(0.6 + Math.random() * 0.9),
        x: 20 + Math.random() * (width - 40),
        y: height + 20,
      });
    }
    ctx.fillStyle = "#1D0F3A";
    ctx.fillRect(0, 0, width, height);
    for (const [x, y, k] of sky) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.25 * Math.sin(t * 2 + k * 9)})`;
      ctx.fillRect(x * width, y * height, 1.5, 1.5);
    }
    for (const star of stars) {
      star.y += star.vy;
      star.x += Math.sin(t * 2 + star.phase) * 0.4;
    }
    stars = stars.filter((star) => !star.caught && star.y > -30);
    ctx.fillStyle = GOLD;
    for (const star of stars) {
      starPath(ctx, star.x, star.y, star.radius, t + star.phase);
      ctx.fill();
    }
    for (const spark of sparks) {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += 0.05;
      spark.life -= 0.025;
      ctx.fillStyle = `rgba(255,170,90,${Math.max(0, spark.life)})`;
      ctx.fillRect(spark.x - 2, spark.y - 2, 4, 4);
    }
    sparks = sparks.filter((spark) => spark.life > 0);
    ctx.fillStyle = GOLD;
    ctx.font = font;
    ctx.fontStretch = "expanded";
    ctx.fillText(`★ ${score}`, 12, 26);
  };
};
