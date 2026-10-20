import { describe, expect, it } from "vitest";

import { seeded } from "./random.ts";

describe(seeded, () => {
  it("repeats the same sequence for the same seed", () => {
    const a = seeded("orkide");
    const b = seeded("orkide");
    expect([a(), a(), a()]).toStrictEqual([b(), b(), b()]);
  });

  it("starts neighbouring seeds apart", () => {
    expect(Math.abs(seeded("plate-1")() - seeded("plate-2")())).toBeGreaterThan(
      0.01
    );
  });

  it("stays between 0 and 1", () => {
    const next = seeded("");
    for (let index = 0; index < 1000; index += 1) {
      const value = next();
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(1);
    }
  });
});
