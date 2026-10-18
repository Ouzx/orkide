/**
 * Indicators: the speaker grille, the page LED bar, the admin's VU columns and counters, and the
 * reading dial on manual pages.
 */
export const meters = {
  /** Counters roll through 0–9 before landing: step = base + n · growth (ms). */
  counter: { base: 35, growth: 3, laps: 10 },
  /** Reading progress: a needle over 21 ticks across 270°, a long tick every 5. */
  dial: { majorEvery: 5, sweep: 270, ticks: 21 },
  /** Speaker grille: holes in a grid; a beat ripples across it (stagger `grille` per hole). */
  grille: { columns: 13, idleBeat: 6000, rowOffset: 3, rows: 4 },
  /** Page position as a row of lamps; the last ones turn amber. */
  ledBar: { amberFrom: 10, count: 12 },
  /** Daily traffic as LED columns; the top segments of the tallest column glow hot. */
  vu: { peakSegments: 2, segments: 18 },
} as const;
