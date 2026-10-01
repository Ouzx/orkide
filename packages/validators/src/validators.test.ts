import { describe, expect, it } from "vitest";

import { safeRichTextDocumentSchema } from "./common.ts";
import { contactInputSchema } from "./contact.ts";
import { postInputSchema } from "./content.ts";

const paragraphWithLink = (href: string) => ({
  content: [
    {
      content: [
        {
          marks: [{ attrs: { href }, type: "link" }],
          text: "link",
          type: "text",
        },
      ],
      type: "paragraph",
    },
  ],
  type: "doc" as const,
});

const translation = (locale: "en" | "tr") => ({
  content: { content: [], type: "doc" as const },
  locale,
  slug: `hello-${locale}`,
  summary: "Summary",
  title: "Hello",
});

describe("rich text link safety", () => {
  it.each(["https://example.com", "mailto:hi@example.com", "/en/blog", "#top"])(
    "accepts %s",
    (href) => {
      expect(
        safeRichTextDocumentSchema.safeParse(paragraphWithLink(href)).success
      ).toBeTruthy();
    }
  );

  // oxlint-disable-next-line no-script-url -- the payloads under test.
  it.each(["javascript:alert(1)", "data:text/html,boom", "vbscript:x"])(
    "rejects %s",
    (href) => {
      expect(
        safeRichTextDocumentSchema.safeParse(paragraphWithLink(href)).success
      ).toBeFalsy();
    }
  );
});

describe("post input", () => {
  it("requires a date for scheduled posts", () => {
    const result = postInputSchema.safeParse({
      status: "scheduled",
      translations: [translation("en")],
    });

    expect(result.success).toBeFalsy();
    expect(result.error?.issues[0]?.path).toStrictEqual(["scheduledAt"]);
  });

  it("rejects duplicate locales", () => {
    const result = postInputSchema.safeParse({
      status: "draft",
      translations: [translation("en"), translation("en")],
    });

    expect(result.success).toBeFalsy();
  });

  it("coerces ISO dates and defaults tags", () => {
    const result = postInputSchema.parse({
      scheduledAt: "2030-01-01T00:00:00.000Z",
      status: "scheduled",
      translations: [translation("en"), translation("tr")],
    });

    expect(result.scheduledAt).toBeInstanceOf(Date);
    expect(result.tagIds).toStrictEqual([]);
  });
});

describe("contact input", () => {
  it("trims fields and validates the email", () => {
    const valid = contactInputSchema.safeParse({
      body: "  I would like to talk about a project.  ",
      email: "ada@example.com",
      locale: "tr",
      name: "  Ada  ",
      turnstileToken: "token",
    });
    const invalid = contactInputSchema.safeParse({
      body: "short",
      email: "not-an-email",
      locale: "en",
      name: "",
      turnstileToken: "",
    });

    expect(valid.data?.name).toBe("Ada");
    expect(invalid.error?.issues.map((issue) => issue.path[0])).toStrictEqual(
      expect.arrayContaining(["body", "email", "name", "turnstileToken"])
    );
  });
});
