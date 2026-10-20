import { tokens } from "../tokens/tokens.ts";

/**
 * Motion of the skin, for scripts. Easings, durations and staggers come from the tokens (the same
 * values the stylesheet reads as `--o-ease-*`, `--o-dur-*`, `--o-stagger-*`); keyframes live in
 * `styles/kit.css` and `styles/motion.css`. Scripts that move things (the CAD cursor, the hero
 * drawing, plates, counters) read their constants here and from `effects/`, never from literals.
 */
export const { ease, duration, reduced, stagger } = tokens;

/** Parts that follow a target frame by frame: value += (target − value) · lerp. */
export const springs = {
  /** The hero drawing's layers spreading apart as the page scrolls. */
  explode: { lerpPerMs: 1 / 120 },
  /** The object-snap marker gliding to the nearest grip. */
  snap: { lerp: 0.4 },
} as const;

/** The cover sheet's load sequence, in milliseconds after the motion layer starts. */
export const choreography = {
  /** Balloons pop one after another once the drawing is plotted. */
  balloon: 70,
  /** The pen starts plotting the hero drawing. */
  plot: 250,
} as const;

/** Ease-out for numbers counting up and lines settling. */
export const easeOutQuart = (k: number): number => 1 - (1 - k) ** 4;

/** Ease-in-out for the plotter's pen. */
export const easeInOutCubic = (k: number): number =>
  k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;

/** A small overshoot for balloons popping in. */
export const backOut = (k: number): number => {
  const c = 1.9;
  return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
};
