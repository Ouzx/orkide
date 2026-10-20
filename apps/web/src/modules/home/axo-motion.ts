import { axo } from "@orkide/ui/effects/axo";
import { springs } from "@orkide/ui/motion/motion";

import { onFrame, onScroll } from "@/shared/motion/frame.ts";
import { afterFirstPaint, motionAllowed } from "@/shared/motion/motion.ts";

import { draw, VIEW } from "./axo.ts";
import type { Balloon, Drawing, DrawnPart } from "./axo.ts";

/**
 * The cover drawing comes alive: it turns when dragged (for everyone), and with motion allowed it
 * sways while idle, spreads its layers as the page scrolls, sends a request down the stack and
 * purges a cached page now and then. Hovering a balloon, a part or a row of the parts list
 * highlights the same part everywhere. The first plot is CSS (`kit.css`), so nothing flashes.
 */
const SVG_NS = "http://www.w3.org/2000/svg";
const BUBBLE = 11.5;

/** A balloon's leader: from its anchor on the part to the edge of its bubble. */
const leader = (balloon: Balloon) => {
  const dx = balloon.bx - balloon.x;
  const dy = balloon.by - balloon.y;
  const length = Math.hypot(dx, dy) || 1;
  const x = balloon.bx - (dx / length) * BUBBLE;
  const y = balloon.by - (dy / length) * BUBBLE;
  return `M${balloon.x.toFixed(1)} ${balloon.y.toFixed(1)}L${x.toFixed(1)} ${y.toFixed(1)}`;
};

/** The part under the pointer: its balloon, or the part drawn there (0 when none). */
const partAt = (target: EventTarget | null) => {
  const element = target instanceof Element ? target : null;
  const balloon = element?.closest<SVGGElement>("[data-balloon]");
  if (balloon) {
    return Number(balloon.dataset.balloon);
  }
  return Number(
    element?.closest<SVGGElement>("[data-part]")?.dataset.part ?? 0
  );
};

/** A purged cache tile flashes red and fades out. */
const fade = async (flash: SVGPathElement) => {
  try {
    await flash.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: axo.purge.fade,
      easing: "ease-out",
    }).finished;
  } finally {
    flash.remove();
  }
};

const clamp = (value: number, [min, max]: readonly [number, number]) =>
  Math.min(max, Math.max(min, value));

interface PartRef {
  readonly group: SVGGElement;
  readonly fills: SVGPathElement[];
  readonly edge: SVGPathElement | null;
  readonly deco: Element | null;
  readonly hatch: Element | null;
  readonly pixel: Element | null;
  readonly label: Element | null;
}

/** Updates one part's paths in place (the number of visible faces changes as it turns). */
const paintPart = (ref: PartRef, part: DrawnPart) => {
  for (const [index, fill] of part.fills.entries()) {
    let path = ref.fills[index];
    if (!path) {
      path = document.createElementNS(SVG_NS, "path");
      ref.group.insertBefore(path, ref.edge);
      ref.fills.push(path);
    }
    path.setAttribute("d", fill.d);
    path.dataset.fill = fill.top ? "top" : "side";
  }
  for (const extra of ref.fills.slice(part.fills.length)) {
    extra.setAttribute("d", "");
  }
  ref.edge?.setAttribute("d", part.edges);
  ref.deco?.setAttribute("d", part.deco);
  ref.hatch?.setAttribute("d", part.hatch);
  ref.pixel?.setAttribute("d", part.pixel);
  if (part.label) {
    ref.label?.setAttribute("transform", part.label.transform);
  }
};

const box = document.querySelector<HTMLElement>("[data-axo]");
const svg = box?.querySelector("svg");
const layer = svg?.querySelector("[data-parts]");

if (box && svg && layer) {
  const moving = motionAllowed();
  // Dragging turns the drawing for every visitor: show the grab cursor.
  box.dataset.live = "";
  const rows = [
    ...document.querySelectorAll<HTMLTableRowElement>("tr[data-part]"),
  ];
  const tip = box.querySelector<HTMLElement>("[data-axo-tip]");
  const gapReadout = document.querySelector("[data-axo-gap]");
  const hiddenPath = svg.querySelector("[data-hidden]");
  const explodePath = svg.querySelector("[data-explode]");
  const routePath = svg.querySelector<SVGPathElement>("[data-path]");
  const packet = svg.querySelector<SVGRectElement>("[data-packet]");

  /* The parts and balloons as drawn by the server, by their stable keys. */
  const parts = new Map<number, PartRef>(
    [...layer.querySelectorAll<SVGGElement>("[data-key]")].map((group) => [
      Number(group.dataset.key),
      {
        deco: group.querySelector("[data-deco]"),
        edge: group.querySelector<SVGPathElement>("[data-edge]"),
        fills: [...group.querySelectorAll<SVGPathElement>("[data-fill]")],
        group,
        hatch: group.querySelector("[data-hatch]"),
        label: group.querySelector("[data-label]"),
        pixel: group.querySelector("[data-pixel]"),
      },
    ])
  );
  const balloons = new Map(
    [...svg.querySelectorAll<SVGGElement>("[data-balloon]")].map((group) => [
      Number(group.dataset.balloon),
      {
        anchor: group.querySelector("[data-anchor]"),
        bubble: group.querySelector("[data-bubble]"),
        group,
        leader: group.querySelector("[data-leader]"),
        text: group.querySelector("text"),
      },
    ])
  );

  let azimuth: number = axo.camera.azimuth;
  let elevation: number = axo.camera.elevation;
  let restAzimuth = azimuth;
  let restElevation = elevation;
  /** When the sway started over: at a release it starts from the angle the drag left. */
  let swayFrom = 0;
  let gap: number = axo.gap.rest;
  let order = "";
  let frame: Drawing | undefined;

  const paintBalloons = (drawing: Drawing) => {
    for (const balloon of drawing.balloons) {
      const ref = balloons.get(balloon.id);
      ref?.leader?.setAttribute("d", leader(balloon));
      ref?.anchor?.setAttribute("cx", balloon.x.toFixed(1));
      ref?.anchor?.setAttribute("cy", balloon.y.toFixed(1));
      ref?.bubble?.setAttribute("cx", balloon.bx.toFixed(1));
      ref?.bubble?.setAttribute("cy", balloon.by.toFixed(1));
      ref?.text?.setAttribute("x", balloon.bx.toFixed(1));
      ref?.text?.setAttribute("y", balloon.by.toFixed(1));
    }
  };

  const render = () => {
    const drawing = draw({ azimuth, elevation, gap });
    frame = drawing;
    // Painter's order: parts move in the DOM only when their order changes.
    const keys = drawing.parts.map((part) => part.key).join(",");
    if (keys !== order) {
      order = keys;
      for (const part of drawing.parts) {
        const ref = parts.get(part.key);
        if (ref) {
          layer.append(ref.group);
        }
      }
    }
    for (const part of drawing.parts) {
      const ref = parts.get(part.key);
      if (ref) {
        paintPart(ref, part);
      }
    }
    hiddenPath?.setAttribute("d", drawing.hidden);
    explodePath?.setAttribute("d", drawing.explode);
    routePath?.setAttribute("d", drawing.route);
    paintBalloons(drawing);
    if (gapReadout) {
      gapReadout.textContent = `Δ ${gap.toFixed(0)}`;
    }
  };

  /* ── One part highlighted everywhere: drawing, balloon, parts list ──────────────────────── */
  let lit = 0;
  const light = (id: number, at?: { x: number; y: number }) => {
    if (id !== lit) {
      lit = id;
      for (const group of layer.querySelectorAll<SVGGElement>("[data-part]")) {
        group.toggleAttribute("data-on", Number(group.dataset.part) === id);
      }
      for (const [balloonId, ref] of balloons) {
        ref.group.toggleAttribute("data-on", balloonId === id);
      }
      for (const row of rows) {
        row.toggleAttribute("data-on", Number(row.dataset.part) === id);
      }
    }
    if (!tip) {
      return;
    }
    const row = rows.find((candidate) => Number(candidate.dataset.part) === id);
    const cells = row ? [...row.cells] : [];
    if (id && at && cells.length > 3) {
      const name = document.createElement("span");
      name.textContent = `${id} · ${cells[1]?.textContent ?? ""}`;
      const what = document.createElement("small");
      what.textContent = cells[3]?.textContent ?? "";
      tip.replaceChildren(name, what);
      const x = Math.min(at.x + 16, box.clientWidth - tip.offsetWidth - 8);
      const y = Math.max(8, at.y - 44);
      tip.style.transform = `translate(${x}px, ${y}px)`;
      tip.dataset.on = "";
    } else {
      delete tip.dataset.on;
    }
  };

  /* ── Drag to turn ───────────────────────────────────────────────────────────────────────── */
  /** SVG units per CSS pixel, so a drag turns the same amount at any size. */
  const viewScale = () => VIEW.width / Math.max(1, box.clientWidth);
  const { camera } = axo;
  let drag:
    | { x: number; y: number; azimuth: number; elevation: number }
    | undefined;
  svg.addEventListener("pointerdown", (event) => {
    // The main button only: a right click opens a menu that swallows the pointerup.
    if (event.button !== 0) {
      return;
    }
    drag = { azimuth, elevation, x: event.clientX, y: event.clientY };
    if (event.pointerType === "mouse") {
      svg.setPointerCapture(event.pointerId);
    }
  });
  svg.addEventListener("pointermove", (event) => {
    if (drag) {
      const scale = viewScale();
      azimuth = clamp(
        drag.azimuth + (event.clientX - drag.x) * scale * camera.dragAzimuth,
        camera.azimuthRange
      );
      elevation = clamp(
        drag.elevation +
          (event.clientY - drag.y) * scale * camera.dragElevation,
        camera.elevationRange
      );
      if (!moving) {
        render();
      }
      return;
    }
    if (event.pointerType === "mouse") {
      const bounds = box.getBoundingClientRect();
      light(partAt(event.target), {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    }
  });
  const release = () => {
    if (drag) {
      drag = undefined;
      restAzimuth = azimuth;
      restElevation = elevation;
      swayFrom = performance.now();
    }
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
  svg.addEventListener("pointerleave", () => {
    if (!drag) {
      light(0);
    }
  });
  for (const row of rows) {
    row.addEventListener("pointerenter", () => light(Number(row.dataset.part)));
    row.addEventListener("pointerleave", () => light(0));
  }

  /* ── Motion: sway, explode on scroll, the request, a purged page ────────────────────────── */
  if (moving) {
    let goal: number = axo.gap.rest;
    const top = box.getBoundingClientRect().top + scrollY;
    onScroll(() => {
      const start = Math.max(0, top - innerHeight * 0.55);
      const k = clamp((scrollY - start) / axo.gap.scroll, [0, 1]);
      goal = axo.gap.rest + (axo.gap.max - axo.gap.rest) * k;
    });

    let visible = true;
    new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    }).observe(box);

    /** A request travels down to D1 and its answer comes back up, lighting each layer it passes. */
    const travel = (elapsed: number, drawing: Drawing) => {
      if (!(packet && routePath)) {
        return;
      }
      const cycle = (elapsed % axo.packet.cycle) / axo.packet.cycle;
      const down = cycle < 0.5;
      const k = down ? cycle * 2 : 2 - cycle * 2;
      const point = routePath.getPointAtLength(k * routePath.getTotalLength());
      packet.removeAttribute("visibility");
      packet.setAttribute(
        "transform",
        `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(45)`
      );
      packet.toggleAttribute("data-up", !down);
      const { levels } = drawing;
      const height = drawing.top + 6 - k * 1.6 * drawing.top;
      // The first floor the request is above, from the top: browser, edge, web, binding, API.
      const floors = [
        levels.browser,
        levels.edge,
        levels.web,
        levels.api + 24,
        levels.api,
      ];
      const above = floors.findIndex((floor) => height > floor);
      const pulse = above === -1 ? 6 : above + 1;
      for (const group of layer.querySelectorAll<SVGGElement>("[data-part]")) {
        group.toggleAttribute(
          "data-pulse",
          Number(group.dataset.part) === pulse
        );
      }
    };

    let last = 0;
    let started = 0;
    onFrame((now) => {
      if (!visible) {
        return;
      }
      started ||= now;
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      if (!drag) {
        azimuth =
          restAzimuth +
          axo.sway.azimuth * Math.sin((now - swayFrom) * axo.sway.azimuthSpeed);
        elevation =
          restElevation +
          axo.sway.elevation *
            Math.sin((now - swayFrom) * axo.sway.elevationSpeed);
      }
      gap += (goal - gap) * Math.min(1, dt * springs.explode.lerpPerMs);
      render();
      if (frame && now - started > axo.plot.duration) {
        travel(now - started, frame);
      }
    });

    // Now and then a cached page is purged: its tile flashes red and fades.
    const tiles = svg.querySelector<SVGGElement>("[data-part='2']");
    setInterval(() => {
      const part = frame?.parts.find((candidate) => candidate.id === 2);
      const shapes = part?.deco.split("Z").filter(Boolean) ?? [];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      if (!(visible && tiles && shape)) {
        return;
      }
      const flash = document.createElementNS(SVG_NS, "path");
      flash.setAttribute("d", `${shape}Z`);
      flash.dataset.pixel = "";
      tiles.append(flash);
      void fade(flash);
    }, axo.purge.every);
  }

  // Once the first plot has run, reordering parts (as the drawing turns) must not replay it.
  setTimeout(() => {
    svg.dataset.plotted = "";
  }, axo.plot.duration + 600);

  afterFirstPaint(() => {
    setTimeout(
      () => {
        const time = document.querySelector("[data-plot-time]");
        if (time) {
          time.textContent = new Date().toLocaleTimeString(
            document.documentElement.lang,
            { hour: "2-digit", minute: "2-digit", second: "2-digit" }
          );
        }
      },
      moving ? axo.plot.duration : 0
    );
  });
}
