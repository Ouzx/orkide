import { meters } from "@orkide/ui/effects/meters";
import { choreography, typeDelay } from "@orkide/ui/motion/motion";

import { onScroll } from "@/shared/motion/frame.ts";
import { soundOn } from "@/shared/sound/sound.ts";

/**
 * The front panel's motion, loaded after first paint when motion is allowed: the display types
 * its headline, the grille beats with each note (and now and then on its own), the page lamps
 * fill as you scroll, and the header's screen names the section in view.
 */

/* ── The display types its headline over a dim copy of it ──────────────────────────────── */
const typed = document.querySelector<HTMLElement>("[data-typed]");
if (typed) {
  const text = typed.textContent ?? "";
  const shown = document.createElement("span");
  const ghost = document.createElement("span");
  ghost.className = "o-ghost";
  ghost.textContent = text;
  typed.replaceChildren(shown, ghost);
  let count = 0;
  const step = () => {
    count += 1;
    shown.textContent = text.slice(0, count);
    ghost.textContent = text.slice(count);
    if (count < text.length) {
      setTimeout(step, typeDelay(text[count - 1] ?? ""));
    }
  };
  setTimeout(step, Math.max(0, choreography.title - performance.now()));
}

/* ── Grille ─────────────────────────────────────────────────────────────────────────────── */
const grille = document.querySelector<HTMLElement>("[data-grille]");
if (grille) {
  const { columns, rowOffset } = meters.grille;
  for (const [index, hole] of [...grille.children].entries()) {
    (hole as HTMLElement).style.setProperty(
      "--d",
      String((index % columns) + Math.floor(index / columns) * rowOffset)
    );
  }
  const beat = () => {
    delete grille.dataset.beat;
    void grille.offsetWidth;
    grille.dataset.beat = "";
  };
  document.addEventListener("soundnote", beat);
  setInterval(() => {
    if (!soundOn() && !document.hidden) {
      beat();
    }
  }, meters.grille.idleBeat);
}

/* ── Page lamps and the header's section readout ───────────────────────────────────────── */
const lamps = [
  ...document.querySelectorAll<HTMLElement>("[data-ledbar] > .o-lamp"),
];
const screen = document.querySelector<HTMLElement>("[data-readout]");
const sections = [
  ...document.querySelectorAll<HTMLElement>("[data-section]"),
].map((section) => ({
  label: `${section.querySelector(".o-sec-no")?.textContent ?? ""} ${section.querySelector(".o-sec-title")?.textContent ?? ""}`,
  section,
}));
const panel = screen?.textContent?.trim() ?? "";
let lit = -1;
let current = "";
onScroll(() => {
  const scrolled =
    scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const next = Math.round(scrolled * lamps.length);
  if (next !== lit) {
    lit = next;
    for (const [index, lamp] of lamps.entries()) {
      if (index < lit) {
        lamp.dataset.tone = index >= meters.ledBar.amberFrom ? "warn" : "ok";
      } else {
        delete lamp.dataset.tone;
      }
    }
  }
  if (screen) {
    let label = panel;
    for (const section of sections) {
      if (section.section.getBoundingClientRect().top < innerHeight * 0.45) {
        ({ label } = section);
      }
    }
    if (label !== current) {
      current = label;
      screen.textContent = label;
    }
  }
});

/* ── Meters roll through their digits once, when they come into view ───────────────────── */
const rolling = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }
      rolling.unobserve(entry.target);
      const reading = entry.target as HTMLElement;
      const target = reading.textContent?.trim() ?? "";
      if (!/^\d+$/u.test(target)) {
        continue;
      }
      const { base, growth, laps } = meters.counter;
      let step = 0;
      const roll = () => {
        step += 1;
        if (step >= laps) {
          reading.textContent = target;
          return;
        }
        reading.textContent = String(step % 10).padStart(target.length, "0");
        setTimeout(roll, base + step * growth);
      };
      roll();
    }
  },
  { threshold: 0.6 }
);
for (const reading of document.querySelectorAll("[data-roll]")) {
  rolling.observe(reading);
}
