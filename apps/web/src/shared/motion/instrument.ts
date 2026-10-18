import { magnet } from "@orkide/ui/effects/magnet";
import { tilt } from "@orkide/ui/effects/tilt";
import type { TiltPreset } from "@orkide/ui/effects/tilt";
import { springs } from "@orkide/ui/motion/motion";

import { onFrame, pointer } from "./frame.ts";

/**
 * The site-wide motion of the skin, loaded after first paint when motion is allowed: panels and
 * cartridges lean toward the pointer, keys lean into it, and blocks below the fold rise in.
 */

/* ── Tilt and glare ─────────────────────────────────────────────────────────────────────── */
const tilted = [...document.querySelectorAll<HTMLElement>("[data-tilt]")].map(
  (element) => ({
    element,
    preset: (tilt[element.dataset.tilt as keyof typeof tilt] ??
      tilt.panel) as TiltPreset,
    x: 0,
    y: 0,
  })
);

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

if (tilted.length > 0) {
  for (const part of tilted) {
    part.element.dataset.live = "";
  }
  onFrame((now) => {
    const idle = !pointer.mouse;
    // Measure every part before writing any style, so a frame forces at most one layout.
    const measured = tilted.map(
      (part) => [part, part.element.getBoundingClientRect()] as const
    );
    for (const [part, box] of measured) {
      if (box.bottom < 0 || box.top > innerHeight) {
        continue;
      }
      const { amplitude, glare, idle: sway, idleAfter, pitch } = part.preset;
      const resting = idle || now - pointer.at > idleAfter;
      const targetX = resting
        ? Math.sin(now / sway.periodX) * sway.reachX
        : clamp((pointer.x - (box.left + box.width / 2)) / (box.width / 2));
      const targetY = resting
        ? Math.cos(now / sway.periodY) * sway.reachY
        : clamp((pointer.y - (box.top + box.height / 2)) / (box.height / 2));
      part.x += (targetX - part.x) * springs.tilt.lerp;
      part.y += (targetY - part.y) * springs.tilt.lerp;
      const { style } = part.element;
      style.setProperty("--ry", `${(part.x * amplitude).toFixed(2)}deg`);
      style.setProperty(
        "--rx",
        `${(-part.y * amplitude * pitch).toFixed(2)}deg`
      );
      style.setProperty(
        "--gx",
        `${(glare.baseX + part.x * glare.travel).toFixed(1)}%`
      );
      style.setProperty(
        "--gy",
        `${(glare.baseY + part.y * glare.travel).toFixed(1)}%`
      );
    }
  });
}

/* ── Magnetic keys ──────────────────────────────────────────────────────────────────────── */
let leaning: HTMLElement | undefined;
document.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    const key = (event.target as Element).closest<HTMLElement>("[data-magnet]");
    if (leaning && leaning !== key) {
      leaning.style.setProperty("--mx", "0px");
      leaning.style.setProperty("--my", "0px");
    }
    leaning = key ?? undefined;
    if (!key) {
      return;
    }
    const box = key.getBoundingClientRect();
    const x = (event.clientX - box.left - box.width / 2) * magnet.x;
    const y = (event.clientY - box.top - box.height / 2) * magnet.y;
    key.style.setProperty("--mx", `${x.toFixed(1)}px`);
    key.style.setProperty("--my", `${y.toFixed(1)}px`);
  },
  { passive: true }
);

/* ── Blocks below the fold rise in once ─────────────────────────────────────────────────── */
const rising = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).dataset.in = "";
        rising.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 }
);
for (const block of document.querySelectorAll<HTMLElement>(
  "[data-section] > *, .o-entries > li"
)) {
  if (block.getBoundingClientRect().top > innerHeight) {
    block.classList.add("o-armed");
    rising.observe(block);
  }
}
