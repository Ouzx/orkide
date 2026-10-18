import { knob as preset } from "@orkide/ui/effects/knob";
import { springs } from "@orkide/ui/motion/motion";

import { onFrame } from "@/shared/motion/frame.ts";
import { afterFirstPaint, motionAllowed } from "@/shared/motion/motion.ts";
import { click, note } from "@/shared/sound/sound.ts";

/**
 * The front panel's knobs: each turns through its items (latest posts, selected work) with
 * detents and opens the selected one when pressed. They work for every visitor; with motion
 * allowed the skirt springs to its detent, otherwise it snaps. The rest of the panel's motion
 * (typing, grille, lamps) loads after first paint from `panel-motion.ts`.
 */
interface Item {
  href: string;
  title: string;
}

const pad = (n: number) => n.toString().padStart(2, "0");
const controls = document.querySelector<HTMLElement>(".o-controls");
const readout = document.querySelector<HTMLElement>("[data-readout-line]");
const hint = document.querySelector<HTMLElement>("[data-hint]");

/** Shows a selection on the display; a line wider than the readout scrolls as a marquee. */
const show = (text: string) => {
  if (!readout) {
    return;
  }
  const line = document.createElement("span");
  line.textContent = text;
  readout.replaceChildren(line);
  if (line.scrollWidth > readout.clientWidth) {
    line.dataset.scroll = "";
  }
};

const knobs = [...document.querySelectorAll<HTMLElement>("[data-knob]")];

for (const [order, element] of knobs.entries()) {
  const items = JSON.parse(element.dataset.items ?? "[]") as Item[];
  const label = element.dataset.label ?? "";
  const unit = element.closest(".o-knob-unit");
  const counter = unit?.querySelector("[data-counter]");
  const lines = [...(unit?.querySelectorAll<SVGLineElement>("line") ?? [])];
  const { sweep } = preset;
  const angleFor = (index: number) =>
    items.length < 2 ? 0 : -sweep / 2 + (sweep * index) / (items.length - 1);

  let index = 0;
  let angle = angleFor(0);
  let target = angle;
  let velocity = 0;
  let stop: (() => void) | undefined;

  const paint = () =>
    element.style.setProperty("--a", `${angle.toFixed(2)}deg`);
  const settle = () => {
    if (!motionAllowed()) {
      angle = target;
      paint();
      return;
    }
    stop ??= onFrame(() => {
      velocity =
        (velocity + (target - angle) * springs.knob.pull) *
        springs.knob.damping;
      angle += velocity;
      paint();
      if (Math.abs(target - angle) < 0.05 && Math.abs(velocity) < 0.05) {
        angle = target;
        paint();
        stop?.();
        stop = undefined;
      }
    });
  };

  const select = (next: number, quiet = false) => {
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    if (clamped !== index && !quiet) {
      click(1.3);
      note(clamped * 2 + order * 3);
    }
    index = clamped;
    target = angleFor(index);
    const item = items[index];
    element.setAttribute("aria-valuenow", String(index + 1));
    element.setAttribute("aria-valuetext", item?.title ?? "");
    for (const line of lines) {
      line.toggleAttribute(
        "data-on",
        Number(line.dataset.degrees) <= target + 0.5
      );
    }
    if (counter) {
      counter.textContent = `${pad(index + 1)}/${pad(items.length)}`;
    }
    show(`${label} ${pad(index + 1)} · ${item?.title ?? ""}`);
    settle();
  };
  const open = () => {
    const item = items[index];
    if (item) {
      location.assign(item.href);
    }
  };

  // The knob becomes a real control: a slider whose value is the selected item.
  element.setAttribute("role", "slider");
  element.tabIndex = 0;
  element.setAttribute("aria-label", label);
  element.setAttribute("aria-valuemin", "1");
  element.setAttribute("aria-valuemax", String(items.length));
  element.setAttribute("aria-valuenow", "1");
  element.setAttribute("aria-valuetext", items[0]?.title ?? "");

  let wheel = 0;
  let drag:
    | { cx: number; cy: number; moved: number; x: number; y: number }
    | undefined;
  element.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    element.setPointerCapture(event.pointerId);
    const box = element.getBoundingClientRect();
    drag = {
      cx: box.left + box.width / 2,
      cy: box.top + box.height / 2,
      moved: 0,
      x: event.clientX,
      y: event.clientY,
    };
  });
  element.addEventListener("pointermove", (event) => {
    if (!drag) {
      return;
    }
    drag.moved +=
      Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y);
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (drag.moved < preset.dragThreshold) {
      return;
    }
    const degrees =
      (Math.atan2(event.clientX - drag.cx, drag.cy - event.clientY) * 180) /
      Math.PI;
    const clamped = Math.max(-sweep / 2, Math.min(sweep / 2, degrees));
    if (items.length < 2) {
      target = clamped * preset.singleItemGive;
      settle();
      return;
    }
    const next = Math.round(
      ((clamped + sweep / 2) / sweep) * (items.length - 1)
    );
    if (next === index) {
      target = clamped;
      settle();
    } else {
      select(next);
    }
  });
  element.addEventListener("pointerup", () => {
    const pressed = drag !== undefined && drag.moved < preset.dragThreshold;
    drag = undefined;
    if (pressed) {
      open();
    } else {
      select(index, true);
    }
  });
  element.addEventListener("pointercancel", () => {
    drag = undefined;
    select(index, true);
  });
  element.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      select(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      select(index - 1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      select(event.key === "Home" ? 0 : items.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
  element.addEventListener(
    "wheel",
    (event) => {
      // Only vertical travel turns the knob, and only while it can turn: at either end the page
      // scrolls on. Travel adds up, so a trackpad doesn't spin through every item at once.
      const step = Math.sign(event.deltaY);
      const next = index + step;
      if (step === 0 || next < 0 || next >= items.length) {
        wheel = 0;
        return;
      }
      event.preventDefault();
      wheel = Math.sign(wheel) === step ? wheel : 0;
      wheel +=
        event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
          ? event.deltaY
          : step * preset.wheelStep;
      if (Math.abs(wheel) >= preset.wheelStep) {
        wheel = 0;
        select(next);
      }
    },
    { passive: false }
  );
  element.addEventListener("focus", () => select(index, true));
}

if (controls && knobs.length > 0) {
  // The knobs are now operable; the grille and lamps stay decoration.
  controls.removeAttribute("aria-hidden");
  for (const decoration of controls.querySelectorAll(".o-grille, .o-ledbar")) {
    decoration.setAttribute("aria-hidden", "true");
  }
  for (const label of controls.querySelectorAll(
    ".o-knob-unit > .o-eng, [data-counter]"
  )) {
    label.setAttribute("aria-hidden", "true");
  }
  if (hint) {
    hint.hidden = false;
  }
}

afterFirstPaint(() => {
  if (motionAllowed()) {
    void import("./panel-motion.ts");
  }
});
