/**
 * Synthesized sounds (catalog SN-01): a mechanical click for keys and switches, a pentatonic note
 * for each detent. Web Audio only, no files. Sound is off until the visitor turns the switch on.
 */
export const sound = {
  /** Played when sound is switched on, and as the "sent" chime: scale steps and spacing (ms). */
  chord: { spacing: 90, steps: [0, 2, 4] },
  /** A short burst of decaying noise through a band-pass filter. */
  click: {
    /** Noise envelope: (1 − t)^decay. */
    decay: 4,
    /** Band-pass centre in Hz, multiplied by the call's pitch (signal keys 0.7, detents 1.3). */
    frequency: 1800,
    gain: 0.5,
    /** Seconds. */
    length: 0.03,
    q: 3,
  },
  /** A triangle note per detent, climbing a major pentatonic scale from `root`. */
  note: {
    /** Seconds. */
    attack: 0.01,
    gain: 0.18,
    release: 0.35,
    root: 330,
    /** Semitones above the root. */
    scale: [0, 2, 4, 7, 9, 12, 14, 16],
    wave: "triangle",
  },
  sent: { spacing: 120, steps: [0, 4, 7] },
} as const;
