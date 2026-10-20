/**
 * A seeded generator: the same seed always gives the same sequence, so a drawing generated from a
 * slug looks the same on the server, in the browser and in the admin. Park–Miller, seeded by a
 * polynomial hash of the text and warmed up, so neighbouring seeds don't start alike.
 */
const MODULUS = 2_147_483_647;

export const seeded = (seed: string): (() => number) => {
  let state = 1;
  for (const char of seed) {
    state = (state * 31 + (char.codePointAt(0) ?? 0)) % MODULUS;
  }
  state ||= 1;
  const next = () => {
    state = (state * 48_271) % MODULUS;
    return state / MODULUS;
  };
  for (let warm = 0; warm < 8; warm += 1) {
    next();
  }
  return next;
};
