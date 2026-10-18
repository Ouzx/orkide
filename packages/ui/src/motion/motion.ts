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
  /** The display starts typing the headline. */
  title: 700,
} as const;

/** The delay before the next character on a display. */
export const typeDelay = (previous: string): number =>
  previous === " " ? stagger["type-space"] : stagger.type;
