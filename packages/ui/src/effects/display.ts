/**
 * The LED display: it types its headline character by character over a dim copy of the whole
 * line (so the layout never jumps), with a blinking block caret. A selection that is wider than
 * the readout scrolls as a marquee. Timing comes from `motion.ts` (`typeDelay`, `choreography`).
 */
export const display = {
  /** Text glow on the headline and on small readouts, in px of blur. */
  glow: { headline: 14, readout: 6 },
  /** A marquee holds still for this fraction of its loop before scrolling. */
  marqueeHold: 0.12,
  /** Doto's roundness axis: 100 draws round dots. */
  rond: 100,
  /** Columns of the pixel grid drawn over the glass, in px (3 clear, 1 dark). */
  scanline: { clear: 3, dark: 1 },
} as const;
