import { describe, expect, it } from "vitest";

import { brief, mixHash, parseMixHash, roleOf } from "./mix.ts";
import type { MixPick } from "./mix.ts";

const pick = (id: string, family: MixPick["family"]): MixPick => ({
  family,
  id,
  name: `Name of ${id}`,
  prompt: `Prompt of ${id} for [subject].`,
});

describe("atlas mix", () => {
  it("makes the first pick the hero, aesthetics the look and the rest support", () => {
    const picks = [
      pick("AE-05", "aesthetic"),
      pick("MO-03", "motion"),
      pick("AE-01", "aesthetic"),
    ];
    expect(picks.map((entry, index) => roleOf(entry, index))).toStrictEqual([
      "hero",
      "support",
      "aesthetic",
    ]);
  });

  it("writes a numbered brief with roles, prompts and the ground rules", () => {
    const text = brief(
      [pick("GN-07", "generative"), pick("AE-06", "aesthetic")],
      "https://example.com/en/atlas"
    );
    expect(text).toContain("(https://example.com/en/atlas)");
    expect(text).toContain(
      "1. Hero: Name of GN-07 (GN-07). Prompt of GN-07 for [subject]."
    );
    expect(text).toContain("2. Aesthetic: Name of AE-06 (AE-06).");
    expect(text).toContain("prefers-reduced-motion");
  });

  it("round-trips a mix through a link fragment", () => {
    const ids = ["MO-03", "GN-07", "AE-05"];
    expect(parseMixHash(mixHash(ids))).toStrictEqual(ids);
    expect(parseMixHash("#dithering")).toBeUndefined();
    expect(parseMixHash("#mix=")).toBeUndefined();
  });
});
