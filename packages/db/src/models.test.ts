import { describe, expect, it } from "vitest";

import { generateId } from "./columns.ts";
import { models } from "./models.ts";

const UUID_V7 =
  /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u;

describe("id generation", () => {
  it("produces time-ordered UUIDv7 strings", () => {
    const first = generateId();
    const second = generateId();

    expect(first).toMatch(UUID_V7);
    expect([second, first].toSorted()).toStrictEqual([first, second]);
  });
});

describe("models registry", () => {
  it("exposes insert, select and update schemas for every table", () => {
    for (const mode of ["insert", "select", "update"] as const) {
      expect(Object.keys(models[mode])).toStrictEqual(
        expect.arrayContaining([
          "post",
          "postTranslation",
          "media",
          "user",
          "contactMessage",
        ])
      );
    }
  });

  it("validates enums and locales derived from the schema", () => {
    const valid = models.insert.contactMessage.safeParse({
      body: "Hello",
      email: "a@b.co",
      locale: "tr",
      name: "Ada",
    });
    const invalid = models.insert.contactMessage.safeParse({
      body: "Hello",
      email: "a@b.co",
      locale: "de",
      name: "Ada",
      status: "deleted",
    });

    expect(valid.success).toBeTruthy();
    expect(invalid.success).toBeFalsy();
    expect(invalid.error?.issues.map((issue) => issue.path[0])).toStrictEqual(
      expect.arrayContaining(["locale", "status"])
    );
  });

  it("allows field-level reuse through `.shape`", () => {
    expect(models.select.post.shape.status.options).toStrictEqual([
      "draft",
      "scheduled",
      "published",
      "archived",
    ]);
  });
});
