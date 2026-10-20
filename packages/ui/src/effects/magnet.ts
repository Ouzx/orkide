/**
 * Buttons lean toward the pointer while it is over them, snapping to a 2 px grid: the offset is
 * the pointer's distance from the centre (−1…1 on each axis) times `steps`, rounded, times `step`.
 * They spring back with `ease.bounce`.
 */
export const magnet = { step: 2, steps: 3 } as const;
