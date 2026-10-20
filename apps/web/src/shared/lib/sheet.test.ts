import { describe, expect, it } from "vitest";

import { sheetNumber } from "./sheet.ts";

describe(sheetNumber, () => {
  it("numbers a sheet by the day it was issued", () => {
    expect(sheetNumber("D", "2026-10-12T09:30:00.000Z")).toBe("D-261012");
  });

  it("gives drafts a blank number", () => {
    expect(sheetNumber("P", null)).toBe("P-000000");
  });
});
