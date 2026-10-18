import { tokens } from "../tokens/tokens.ts";

/**
 * Motion of the skin, for scripts. Easings, durations and staggers come from the tokens (the same
 * values the stylesheet reads as `--o-ease-*`, `--o-dur-*`, `--o-stagger-*`); CSS keyframes live in
 * `styles/motion.css`. Scripts that move things (tilt, knobs, typing, counters) read their
 * constants here and from `effects/`, never from literals.
 */
export const { ease, duration, reduced, stagger } = tokens;

/** Physics for parts that follow a target frame by frame (critically damped enough to settle). */
export const springs = {
  /** A knob's skirt chasing its detent: velocity += (target − angle) · pull, then × damping. */
  knob: { damping: 0.62, pull: 0.22 },
  /** A tilting panel easing toward the pointer: value += (target − value) · lerp. */
  tilt: { lerp: 0.08 },
} as const;

/** The front panel's page-load sequence, in milliseconds from navigation. */
export const choreography = {
  /** The panel powers on (`boot` keyframes, `duration.boot`, `ease.spring`). */
  panel: 100,
  /** Re-typing after the language changes. */
  retype: 200,
  /** The display starts typing the headline. */
  title: 700,
} as const;

/** The delay of the `index`-th item in a staggered group. */
export const staggered = (index: number, step: number, base = 0): number =>
  base + index * step;

/** The delay before the next character on a display. */
export const typeDelay = (previous: string): number =>
  previous === " " ? stagger["type-space"] : stagger.type;

/**
 * View Transition names and their timing: the outgoing page powers down, the new one powers on.
 * The keyframes are `pw-off` / `pw-on` in `styles/motion.css`.
 */
export const viewTransition = {
  in: { duration: duration.hole, easing: ease.out },
  out: { duration: duration.quick, easing: ease.out },
} as const;
