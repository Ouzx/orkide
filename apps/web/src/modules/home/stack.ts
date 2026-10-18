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
    // The centre of each stage's socket, in pixels from the chain's top (wrapping moves them).
    const sockets = steps.map((step) => {
      const socket = step.querySelector("i");
      return (
        step.offsetTop +
        (socket ? socket.offsetTop + socket.offsetHeight / 2 : 0)
      );
    });
    // The signal sits where a reading line at 45 % of the viewport crosses the cable, from the
    // first socket to the last; a stage lights when the line reaches its socket.
    const line = innerHeight * 0.45 - chain.getBoundingClientRect().top;
    const y = Math.min(sockets.at(-1) ?? 0, Math.max(sockets[0] ?? 0, line));
    const top = `${y.toFixed(1)}px`;
    if (top !== shown) {
      shown = top;
      chain.style.setProperty("--y", top);
    }
    while ((sockets[reached + 1] ?? Number.POSITIVE_INFINITY) <= line) {
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
