/**
 * The holographic foil that slides across a cartridge as it tilts (catalog SP-04): a diagonal band
 * of the `holo-*` colour tokens, blended with `screen`, positioned by the tilt's `--gx` / `--gy`.
 * The panel gets a soft `hl` highlight instead, blended `soft-light`.
 */
export const glare = {
  /** Band angle, in degrees. */
  angle: 115,
  panel: { opacity: 0.9, radiusX: 40, radiusY: 50 },
  /** Background size, in %: how far the band can travel. */
  size: 260,
  /** The band's stops (token, position %); transparent at 30 % and 72 %. */
  stops: [
    ["holo-gold", 45],
    ["holo-cyan", 52],
    ["holo-pink", 58],
  ],
} as const;
