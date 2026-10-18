/**
 * The page's one animation loop. Parts that move every frame register a callback; the loop runs
 * only while something is registered and the tab is visible.
 */
type Tick = (now: number) => void;

const ticks = new Set<Tick>();
let running = false;

const loop = (now: number) => {
  if (ticks.size === 0 || document.hidden) {
    running = false;
    return;
  }
  for (const tick of ticks) {
    tick(now);
  }
  requestAnimationFrame(loop);
};

const wake = () => {
  if (!running && ticks.size > 0 && !document.hidden) {
    running = true;
    requestAnimationFrame(loop);
  }
};

document.addEventListener("visibilitychange", wake);

/** Calls `tick` every frame until the returned function is called. */
export const onFrame = (tick: Tick): (() => void) => {
  ticks.add(tick);
  wake();
  return () => ticks.delete(tick);
};

/** Calls `paint` now, then at most once per frame while the page scrolls or resizes. */
export const onScroll = (paint: () => void): void => {
  let frame = 0;
  const schedule = () => {
    frame ||= requestAnimationFrame(() => {
      frame = 0;
      paint();
    });
  };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  paint();
};

/** The mouse pointer, in viewport pixels, and when it last moved (touch is ignored). */
export const pointer = { at: 0, mouse: false, x: 0, y: 0 };

addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType === "mouse") {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.at = performance.now();
      pointer.mouse = true;
    }
  },
  { passive: true }
);
