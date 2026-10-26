import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "Hundreds of particles trace an invisible current that bends toward the cursor.",
    tr: "Yüzlerce parçacık, imlece doğru kıvrılan görünmez bir akıntıyı izler.",
  },
  family: "generative",
  fit: "strong",
  hint: "move",
  id: "GN-04",
  name: { en: "Flow fields", tr: "Akış alanları" },
  pairs: ["AE-04", "MO-01", "SN-01", "PH-04"],
  prompt:
    "Draw a flow-field particle system behind [subject]: 500–1500 particles following a time-varying noise field, leaving fading trails in [palette], gently attracted to the cursor. Canvas 2D, paused when offscreen.",
  refs: [
    {
      label: "Tyler Hobbs: flow fields",
      url: "https://tylerxhobbs.com/essays/2020/flow-fields",
    },
    { label: "Generative Artistry", url: "https://generativeartistry.com/" },
  ],
  slug: "flow-fields",
  tags: ["Canvas 2D", "noise", "particles"],
} satisfies SpecimenInput;

interface Particle {
  life: number;
  x: number;
  y: number;
}

const COUNT = 520;

/** 520 particles follow a drifting field of sines, leaning toward the pointer; old trails fade. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const pointer = track(stage);
  let particles: Particle[] = [];
  const reset = () => {
    const { ctx, width, height } = view;
    particles = Array.from({ length: COUNT }, () => ({
      life: Math.random() * 200,
      x: Math.random() * width,
      y: Math.random() * height,
    }));
    ctx.fillStyle = "#120E1F";
    ctx.fillRect(0, 0, width, height);
  };
  reset();
  view.onResize = reset;
  return (t) => {
    const { ctx, width, height } = view;
    ctx.fillStyle = "rgba(18,14,31,.08)";
    ctx.fillRect(0, 0, width, height);
    const aim = pointer.at(t);
    const ax = aim.x * width;
    const ay = aim.y * height;
    ctx.lineWidth = 1.2;
    for (const particle of particles) {
      const { x, y } = particle;
      const angle =
        Math.sin(x * 0.012 + t * 0.3) * 2 +
        Math.cos(y * 0.014 - t * 0.2) * 2 +
        Math.atan2(ay - y, ax - x) * 0.18;
      const nx = x + Math.cos(angle) * 1.6;
      const ny = y + Math.sin(angle) * 1.6;
      ctx.strokeStyle = `hsla(${190 + (y / height) * 130},90%,66%,.6)`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      particle.x = nx;
      particle.y = ny;
      particle.life -= 1;
      if (particle.life < 0 || nx < 0 || ny < 0 || nx > width || ny > height) {
        particle.x = Math.random() * width;
        particle.y = Math.random() * height;
        particle.life = 100 + Math.random() * 200;
      }
    }
  };
};
