import { duration, easeOutQuart } from "@orkide/ui/motion/motion";

import { onFrame, onScroll } from "@/shared/motion/frame.ts";
import { afterFirstPaint, motionAllowed } from "@/shared/motion/motion.ts";

/**
 * Section A–A's readings: how long this page load took to reach each stage, from the browser's own
 * timing entries (so the cached HTML is the same for every visitor). With motion allowed, the
 * cutting plane follows the scroll, each stage is hatched as the plane reaches it and its reading
 * counts up; otherwise the readings simply appear.
 */
const cut = document.querySelector<HTMLElement>("[data-cut]");

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

const show = (index: number, value: number | undefined) => {
  for (const counter of document.querySelectorAll<HTMLElement>(
    `[data-timing="${index}"]`
  )) {
    counter.textContent =
      value === undefined ? "—" : Math.round(value).toString();
  }
};

const countUp = (index: number, value: number | undefined) => {
  if (value === undefined) {
    show(index, value);
    return;
  }
  const start = performance.now();
  const stop = onFrame((now) => {
    const k = Math.min(1, (now - start) / (duration.count * 0.6));
    show(index, value * easeOutQuart(k));
    if (k >= 1) {
      stop();
    }
  });
};

afterFirstPaint(() => {
  const values = readings();
  if (!(cut && motionAllowed())) {
    for (const [index, value] of values.entries()) {
      show(index, value);
    }
    return;
  }

  const stages = [...cut.querySelectorAll<HTMLElement>("[data-stage]")];
  const links = [...cut.querySelectorAll<HTMLElement>("[data-chain]")];
  const plane = cut.querySelector<HTMLElement>(".o-cutline");
  const count = Math.max(1, stages.length);
  let reached = -1;
  onScroll(() => {
    const box = cut.getBoundingClientRect();
    const progress = Math.min(
      1,
      Math.max(
        0,
        (innerHeight * 0.85 - box.top) / (box.height + innerHeight * 0.25)
      )
    );
    plane?.style.setProperty("--cut", progress.toFixed(3));
    const span = progress * (count + 0.4);
    for (const [index, link] of links.entries()) {
      const k = Math.min(1, Math.max(0, span - index));
      link.style.setProperty("--k", k.toFixed(3));
      link.toggleAttribute("data-on", k >= 1);
    }
    while (reached + 1 < count && span >= reached + 1.45) {
      reached += 1;
      stages[reached]?.toggleAttribute("data-on", true);
      countUp(reached, values[reached]);
    }
  });
});
