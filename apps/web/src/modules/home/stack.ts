import { onScroll } from "@/shared/motion/frame.ts";
import { afterFirstPaint, motionAllowed } from "@/shared/motion/motion.ts";

/**
 * The signal chain's readings: how long this page load took to reach each stage, from the
 * browser's own timing entries (so the cached HTML is the same for every visitor). With motion
 * allowed, a signal travels down the cable as the section scrolls by, lighting each stage and
 * counting its reading up; otherwise the readings simply appear.
 */
const chain = document.querySelector<HTMLElement>("[data-chain]");
const counters = [...document.querySelectorAll<HTMLElement>("[data-timing]")];

/** A timing entry, or nothing when the browser left it at zero. */
const positive = (value: number | undefined) =>
  value !== undefined && value > 0 ? value : undefined;

/** Milliseconds since navigation at each stage: request, first byte, last byte, interactive, first paint. */
const readings = (): (number | undefined)[] => {
  const [navigation] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[];
  const [paint] = performance.getEntriesByName("first-contentful-paint");
  return [
    positive(navigation?.requestStart),
    positive(navigation?.responseStart),
    positive(navigation?.responseEnd),
    positive(navigation?.domInteractive),
    positive(paint?.startTime),
  ];
};

const format = (value: number | undefined) =>
  value === undefined ? "—" : `${Math.round(value)} ms`;

/** Counts a reading up from zero in a few steps, like a meter settling. */
const countUp = (counter: HTMLElement, value: number | undefined) => {
  if (value === undefined) {
    counter.textContent = format(value);
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / 600);
    counter.textContent = format(value * (Math.floor(progress * 8) / 8));
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
};

afterFirstPaint(() => {
  const values = readings();
  if (!(chain && motionAllowed())) {
    for (const [index, counter] of counters.entries()) {
      counter.textContent = format(values[index]);
    }
    return;
  }

  const steps = [...chain.querySelectorAll<HTMLElement>(".o-chain-step")];
  const signal = chain.querySelector<HTMLElement>("[data-signal]");
  chain.dataset.armed = "";
  if (signal) {
    signal.hidden = false;
  }
  let reached = -1;
  let shown = "";
  onScroll(() => {
    const box = chain.getBoundingClientRect();
    // 0 when the chain's top reaches 75 % of the viewport, 1 when its bottom reaches 45 %.
    const travel = box.height + innerHeight * 0.3;
    const progress = Math.min(
      1,
      Math.max(0, (innerHeight * 0.75 - box.top) / travel)
    );
    const p = progress.toFixed(4);
    if (p !== shown) {
      shown = p;
      chain.style.setProperty("--p", p);
    }
    const next = Math.floor(progress * (steps.length - 1) + 0.02);
    while (reached < next) {
      reached += 1;
      const stage = steps[reached];
      const counter = counters[reached];
      if (stage && counter) {
        stage.dataset.on = "";
        countUp(counter, values[reached]);
      }
    }
  });
});
