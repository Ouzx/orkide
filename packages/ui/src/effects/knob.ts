/**
 * A rotary selector with detents (catalog MO-05). It is an ARIA slider: drag around it, scroll
 * over it, or use the arrow keys; a click or Enter opens the selected item. The skirt springs to
 * the detent with `springs.knob` from `motion.ts`.
 */
export const knob = {
  /** Pointer travel, in px, before a press becomes a drag (below it, it's a click). */
  dragThreshold: 6,
  /** How close (in detent units) a tick must be to a detent to be drawn long. */
  majorTolerance: 0.02,
  /** With a single item the knob still turns, by this fraction of the drag, and springs back. */
  singleItemGive: 0.15,
  /** Total sweep, in degrees, centred on 12 o'clock (−135° … +135°). */
  sweep: 270,
  /** Tick marks every `tickStep` degrees around the dial; the ticks at detents are long. */
  tickStep: 10,
  /** Tick radii in the 132-unit dial: minor ticks start further out than detent ticks. */
  ticks: { inner: 58, innerMajor: 54, outer: 63 },
} as const;
