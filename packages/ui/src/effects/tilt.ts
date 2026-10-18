/**
 * Panels that lean toward the pointer (catalog SP-04). With no mouse, or after `idleAfter`
 * milliseconds without one, they sway on their own on two slow sines, so phones get motion too.
 */
export interface TiltPreset {
  /** Largest rotation around Y, in degrees; X uses `amplitude · pitch`. */
  amplitude: number;
  pitch: number;
  /** Idle sway: periods of the sines driving X and Y, and their reach (−1…1). */
  idle: { periodX: number; periodY: number; reachX: number; reachY: number };
  /** Milliseconds without pointer movement before the idle sway takes over. */
  idleAfter: number;
  /** Where the glare's centre sits: base and travel, in % of the panel. */
  glare: { baseX: number; baseY: number; travel: number };
}

const idle = { periodX: 1700, periodY: 2100, reachX: 0.6, reachY: 0.5 };
const glare = { baseX: 50, baseY: 40, travel: 40 };

export const tilt = {
  /** A project cartridge: a small object, so it leans further. */
  cartridge: { amplitude: 12, glare, idle, idleAfter: 2600, pitch: 0.8 },
  /** The front panel on the home page. */
  panel: { amplitude: 5, glare, idle, idleAfter: 2600, pitch: 0.8 },
} as const satisfies Record<string, TiltPreset>;
