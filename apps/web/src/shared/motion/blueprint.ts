import { cad } from "@orkide/ui/effects/cad";
import { magnet } from "@orkide/ui/effects/magnet";
import {
  duration,
  easeOutQuart,
  springs,
  stagger,
} from "@orkide/ui/motion/motion";

import { cloud } from "./cloud.ts";
import { onFrame, pointer } from "./frame.ts";

/**
 * The site-wide motion of the Blueprint, loaded after first paint when motion is allowed. At rest
 * every part is already drawn; this only adds the drawing of it: rules and bubbles draw when their
 * section arrives, plates are plotted by pen, numbers count up, the newest entry gets a revision
 * cloud, buttons snap toward the pointer, and fine pointers get a CAD cursor.
 */
const root = document.documentElement;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/* ── Count up from zero ─────────────────────────────────────────────────────────────────── */
const countUp = (element: HTMLElement) => {
  const target = Number(element.dataset.count);
  if (!Number.isFinite(target) || target === 0) {
    return;
  }
  const start = performance.now();
  const stop = onFrame((now) => {
    const k = clamp((now - start) / duration.count, 0, 1);
    element.textContent = Math.round(target * easeOutQuart(k)).toString();
    if (k >= 1) {
      stop();
    }
  });
};

/* ── Plates are plotted stroke by stroke ───────────────────────────────────────────────── */
const plot = (art: Element, delay: number) => {
  const strokes = [...art.querySelectorAll<SVGElement>("[data-stroke]")];
  const each = duration.plot / Math.max(1, strokes.length);
  for (const [index, stroke] of strokes.entries()) {
    stroke.style.animationDuration = `${Math.max(240, each * 3).toFixed(0)}ms`;
    stroke.style.animationDelay = `${(delay + index * each).toFixed(0)}ms`;
  }
};

/* ── Arrivals ───────────────────────────────────────────────────────────────────────────── */
const arrive = (element: HTMLElement, order: number) => {
  element.dataset.in = "";
  for (const counter of element.querySelectorAll<HTMLElement>("[data-count]")) {
    countUp(counter);
  }
  let plates = 0;
  for (const art of element.querySelectorAll<SVGElement>("[data-plot]")) {
    plot(art, order * stagger.plate + plates * stagger.plate);
    art.dataset.in = "";
    plates += 1;
  }
  for (const target of element.querySelectorAll<HTMLElement>("[data-cloud]")) {
    setTimeout(() => cloud(target, target.dataset.cloud ?? ""), 500);
  }
};

const arriving = new IntersectionObserver(
  (entries) => {
    let order = 0;
    for (const entry of entries) {
      if (entry.isIntersecting) {
        arriving.unobserve(entry.target);
        arrive(entry.target as HTMLElement, order);
        order += 1;
      }
    }
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.01 }
);

// Parts already on screen keep their drawn state: only what is still below the fold is redrawn.
for (const section of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
  if (section.getBoundingClientRect().top < innerHeight * 0.9) {
    section.dataset.in = "";
    for (const art of section.querySelectorAll<SVGElement>("[data-plot]")) {
      art.dataset.in = "";
    }
  } else {
    arriving.observe(section);
  }
}
root.classList.add("o-moving");

/* ── Hover dimensions on plates and figures ─────────────────────────────────────────────── */
for (const part of document.querySelectorAll<HTMLElement>("[data-dim]")) {
  const dims = document.createElement("span");
  dims.className = "o-dims";
  dims.setAttribute("aria-hidden", "true");
  const width = document.createElement("span");
  const height = document.createElement("span");
  const widthValue = document.createElement("b");
  const heightValue = document.createElement("b");
  width.append(widthValue);
  height.append(heightValue);
  dims.append(width, height);
  part.append(dims);
  part.addEventListener("pointerenter", () => {
    const w = part.offsetWidth;
    const h = part.offsetHeight;
    part.dataset.dimOn = "";
    const start = performance.now();
    const stop = onFrame((now) => {
      const k = easeOutQuart(clamp((now - start) / 520, 0, 1));
      widthValue.textContent = `${Math.round(w * k)} px`;
      heightValue.textContent = `${Math.round(h * k)} px`;
      if (k >= 1) {
        stop();
      }
    });
  });
  part.addEventListener("pointerleave", () => {
    delete part.dataset.dimOn;
  });
}

/* ── Buttons snap toward the pointer on a 2 px grid ─────────────────────────────────────── */
/** The offset for a pointer `offset` px from the centre of a `size` px button. */
const snap = (offset: number, size: number) =>
  Math.round(clamp(offset / (size / 2), -1, 1) * magnet.steps) * magnet.step;

let leaning: HTMLElement | undefined;
document.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLElement>("[data-magnet]") ?? undefined;
    if (leaning && leaning !== button) {
      leaning.style.removeProperty("--mx");
      leaning.style.removeProperty("--my");
    }
    leaning = button;
    if (!button) {
      return;
    }
    const box = button.getBoundingClientRect();
    button.style.setProperty(
      "--mx",
      `${snap(event.clientX - box.left - box.width / 2, box.width)}px`
    );
    button.style.setProperty(
      "--my",
      `${snap(event.clientY - box.top - box.height / 2, box.height)}px`
    );
  },
  { passive: true }
);

/* ── The status line names the section in view ──────────────────────────────────────────── */
const sectionName = document.querySelector("[data-section-name]");
if (sectionName) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const name = (entry.target as HTMLElement).dataset.sectionTitle;
        if (entry.isIntersecting && name) {
          sectionName.textContent = name;
        }
      }
    },
    { rootMargin: "-35% 0px -60% 0px" }
  );
  for (const section of document.querySelectorAll("[data-section-title]")) {
    spy.observe(section);
  }
}

/* ── The CAD cursor: crosshair, ruler marks, coordinates and object snap ─────────────────── */
const crosshair = document.querySelector<HTMLElement>("[data-cad]");
const osnap = document.querySelector<HTMLElement>("[data-osnap]");
const markX = document.querySelector<HTMLElement>('[data-ruler-mark="x"]');
const markY = document.querySelector<HTMLElement>('[data-ruler-mark="y"]');
const zones = document.querySelector<HTMLElement>('[data-zones="top"]');
const xy = [...document.querySelectorAll("[data-xy] b")];

if (
  crosshair &&
  osnap &&
  markX &&
  markY &&
  zones &&
  matchMedia("(pointer: fine)").matches
) {
  const label = osnap.querySelector("span");
  let hot: Element | undefined;
  let textual = false;
  let snapX = 0;
  let snapY = 0;
  let kind = "";
  let zone = -1;
  let running: (() => void) | undefined;

  const paint = (now: number) => {
    if (now - pointer.at > cad.idleAfter) {
      running?.();
      running = undefined;
      return;
    }
    const { x, y } = pointer;
    crosshair.style.transform = `translate(${x}px, ${y}px)`;
    markX.style.transform = `translateX(${x}px)`;
    markY.style.transform = `translateY(${y}px)`;
    crosshair.toggleAttribute("data-hot", hot !== undefined);

    const ruler = zones.getBoundingClientRect();
    const spans = [
      ...zones.querySelectorAll<HTMLElement>(":scope > span"),
    ].filter((span) => span.offsetParent !== null);
    const index = ruler.width
      ? Math.floor(((x - ruler.left) / ruler.width) * spans.length)
      : -1;
    if (index !== zone) {
      delete spans[zone]?.dataset.on;
      const reached = spans[index];
      if (reached) {
        reached.dataset.on = "";
      }
      zone = index;
    }
    const [mmX, mmY] = xy;
    if (mmX && mmY) {
      mmX.textContent = (Math.max(0, x - ruler.left) * cad.mmPerPx).toFixed(1);
      mmY.textContent = (
        Math.max(0, y - ruler.bottom + scrollY) * cad.mmPerPx
      ).toFixed(1);
    }

    if (hot && !textual) {
      const box = hot.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const grips: [number, number, string][] = [
        [box.left, box.top, "end"],
        [box.right, box.top, "end"],
        [box.left, box.bottom, "end"],
        [box.right, box.bottom, "end"],
        [cx, box.top, "mid"],
        [cx, box.bottom, "mid"],
        [box.left, cy, "mid"],
        [box.right, cy, "mid"],
        [cx, cy, "cen"],
      ];
      const [first] = grips;
      let best = first ?? [cx, cy, "cen"];
      let nearest = Number.POSITIVE_INFINITY;
      for (const grip of grips) {
        const distance = Math.hypot(grip[0] - x, grip[1] - y);
        if (distance < nearest) {
          nearest = distance;
          best = grip;
        }
      }
      if (!Object.hasOwn(osnap.dataset, "live")) {
        [snapX, snapY] = best;
      }
      const [targetX, targetY, grip] = best;
      snapX += (targetX - snapX) * springs.snap.lerp;
      snapY += (targetY - snapY) * springs.snap.lerp;
      osnap.style.transform = `translate(${snapX}px, ${snapY}px)`;
      if (grip !== kind) {
        kind = grip;
        osnap.dataset.kind = kind;
        if (label) {
          label.textContent = osnap.dataset[kind] ?? "";
        }
      }
      osnap.toggleAttribute("data-live", true);
    } else {
      delete osnap.dataset.live;
      kind = "";
    }
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      textual = Boolean(target?.closest(cad.textual));
      hot = target?.closest(cad.snapTo) ?? undefined;
      root.classList.toggle("o-cad-on", !textual);
      crosshair.toggleAttribute("data-live", !textual);
      markX.toggleAttribute("data-live", true);
      markY.toggleAttribute("data-live", true);
      running ??= onFrame(paint);
    },
    { passive: true }
  );
  document.addEventListener("pointerdown", () => {
    crosshair.dataset.press = "";
  });
  document.addEventListener("pointerup", () => {
    delete crosshair.dataset.press;
  });
  root.addEventListener("pointerleave", () => {
    root.classList.remove("o-cad-on");
    delete crosshair.dataset.live;
    delete osnap.dataset.live;
    delete markX.dataset.live;
    delete markY.dataset.live;
  });
}
