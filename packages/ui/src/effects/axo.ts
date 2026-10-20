/**
 * The cover's exploded isometric drawing of the stack: camera, explosion, the pen that plots it
 * and the request that travels through it. Angles are radians, lengths drawing units, times ms.
 * Dragging turns the camera within its ranges, so the drawing stays readable.
 */
export const axo = {
  camera: {
    azimuth: -0.62,
    azimuthRange: [-1.45, 0.25],
    dragAzimuth: 0.008,
    dragElevation: 0.004,
    elevation: 0.5,
    elevationRange: [0.22, 0.9],
  },
  /** Gap between layers at rest and fully exploded, and the scroll distance between the two. */
  gap: { max: 72, rest: 30, scroll: 620 },
  /** A request travels down the stack and back up once per cycle. */
  packet: { cycle: 3600 },
  /** The pen plotting the drawing on first view. */
  plot: { duration: 2700 },
  /** Edge-cache tiles: one is purged (flashes) every so often. */
  purge: { every: 1700, fade: 700 },
  /** Idle sway while nobody drags: amplitude and angular speed per axis. */
  sway: {
    azimuth: 0.11,
    azimuthSpeed: 0.00032,
    elevation: 0.035,
    elevationSpeed: 0.00023,
  },
} as const;
