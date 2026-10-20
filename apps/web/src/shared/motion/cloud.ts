/**
 * A revision cloud around an element: the scalloped outline drafters draw around a change, with a
 * delta triangle carrying the revision mark. Drawn as SVG over the element (decoration only).
 */
import { seeded } from "@/shared/lib/random.ts";

const SVG = "http://www.w3.org/2000/svg";

/** Scallops along the rectangle inset `m` from a `w`×`h` box, bulging outward. */
const scallops = (
  w: number,
  h: number,
  m: number,
  radius: number,
  random: () => number
) => {
  const corners = [
    [m, m],
    [w - m, m],
    [w - m, h - m],
    [m, h - m],
  ] as const;
  let path = `M${m} ${m}`;
  for (let side = 0; side < 4; side += 1) {
    const [x0, y0] = corners[side] ?? [0, 0];
    const [x1, y1] = corners[(side + 1) % 4] ?? [0, 0];
    const length = Math.hypot(x1 - x0, y1 - y0);
    const count = Math.max(2, Math.round(length / (radius * 2.1)));
    const steps = Array.from({ length: count }, () => 0.7 + random() * 0.6);
    const total = steps.reduce((sum, step) => sum + step, 0);
    const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    for (const step of steps) {
      const dx = ((x1 - x0) * step) / total;
      const dy = ((y1 - y0) * step) / total;
      const chord = Math.hypot(dx, dy);
      path += ` a${(chord / 2).toFixed(1)} ${(chord * (0.3 + random() * 0.12)).toFixed(1)} ${angle.toFixed(0)} 0 1 ${dx.toFixed(1)} ${dy.toFixed(1)}`;
    }
  }
  return `${path}Z`;
};

export const cloud = (host: HTMLElement, mark: string, radius = 8): void => {
  host.querySelector(":scope > .o-cloud")?.remove();
  if (!host.offsetWidth) {
    return;
  }
  const m = radius + 2;
  const pad = m + 2;
  const w = host.offsetWidth + pad * 2;
  const h = host.offsetHeight + pad * 2;
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "o-cloud");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.style.left = `${-pad}px`;
  svg.style.top = `${-pad}px`;
  const outline = document.createElementNS(SVG, "path");
  outline.setAttribute("d", scallops(w, h, m, radius, seeded(`${mark}${w}`)));
  outline.setAttribute("pathLength", "1");
  const delta = document.createElementNS(SVG, "polygon");
  const x = w - m;
  const y = m;
  delta.setAttribute(
    "points",
    `${x},${y - 11} ${x + 11},${y + 8} ${x - 11},${y + 8}`
  );
  const text = document.createElementNS(SVG, "text");
  text.setAttribute("x", String(x));
  text.setAttribute("y", String(y + 5));
  text.textContent = mark;
  svg.append(outline, delta, text);
  if (getComputedStyle(host).position === "static") {
    host.style.position = "relative";
  }
  host.append(svg);
};
