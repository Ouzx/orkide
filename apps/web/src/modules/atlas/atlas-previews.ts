import { onFrame } from "@/shared/motion/frame.ts";
import { motionAllowed } from "@/shared/motion/motion.ts";

import type { Frame, Preview } from "./preview-kit.ts";

/**
 * The atlas's live specimens. Each preview's code loads when its stage nears the viewport; every
 * preview on screen then draws on the page's one animation loop, and stops while it is off screen.
 * With motion off, a preview is drawn as a still: a second and a half of frames at once.
 */
const loaders = import.meta.glob<Preview>("./specimens/*.ts", {
  import: "preview",
});
const previews = new Map(
  Object.entries(loaders).map(([path, load]) => [
    path.slice(path.lastIndexOf("/") + 1, -".ts".length),
    load,
  ])
);

interface Running {
  frame?: Frame;
  visible: boolean;
}

const running = new Map<HTMLElement, Running>();
const startedAt = performance.now();
let stopLoop: (() => void) | undefined;

const fail = (stage: HTMLElement, entry: Running) => {
  delete entry.frame;
  stage.dataset.failed = "";
};

const tick = (now: number) => {
  const t = (now - startedAt) / 1000;
  for (const [stage, entry] of running) {
    if (entry.visible && entry.frame) {
      try {
        entry.frame(t);
      } catch {
        fail(stage, entry);
      }
    }
  }
};

/** Runs the loop while motion is allowed and a running preview is on screen. */
const schedule = () => {
  const wanted =
    motionAllowed() &&
    [...running.values()].some((entry) => entry.visible && entry.frame);
  if (wanted && !stopLoop) {
    stopLoop = onFrame(tick);
  } else if (!wanted && stopLoop) {
    stopLoop();
    stopLoop = undefined;
  }
};

const STILL_FRAMES = 90;

const start = async (stage: HTMLElement) => {
  const entry: Running = { visible: true };
  running.set(stage, entry);
  try {
    const load = previews.get(stage.dataset.stage ?? "");
    if (!load) {
      throw new Error(`No preview for ${stage.dataset.stage ?? "a stage"}`);
    }
    const frame = (await load())(stage);
    if (frame) {
      entry.frame = frame;
      if (!motionAllowed()) {
        // A still is drawn once the stage has its size, and again whenever it changes (a
        // resized canvas is cleared, and with motion off no frame comes to repaint it).
        const still = () => {
          for (let index = 0; index < STILL_FRAMES; index += 1) {
            frame(index / 60);
          }
        };
        const observer = new ResizeObserver(still);
        observer.observe(stage);
      }
    }
  } catch {
    fail(stage, entry);
  }
  schedule();
};

const near = new IntersectionObserver(
  (entries) => {
    for (const { isIntersecting, target } of entries) {
      const stage = target as HTMLElement;
      const entry = running.get(stage);
      if (entry) {
        entry.visible = isIntersecting;
      } else if (isIntersecting) {
        void start(stage);
      }
    }
    schedule();
  },
  { rootMargin: "200px 0px" }
);

for (const stage of document.querySelectorAll<HTMLElement>("[data-stage]")) {
  near.observe(stage);
}
document.addEventListener("motionchange", schedule);
