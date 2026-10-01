import { describe, expect, it } from "vitest";

import { readingTime, renderDocument } from "./render.ts";
import { slugify } from "./slug.ts";

describe(slugify, () => {
  it.each([
    ["Çalışma Ağacı", "calisma-agaci"],
    ["İstanbul'da Şeftali Üretimi", "istanbul-da-seftali-uretimi"],
    ["  Hello,   World!  ", "hello-world"],
    ["Straße & Ærø", "strasse-aero"],
    ["TypeScript 7.0 — what's new?", "typescript-7-0-what-s-new"],
  ])("slugifies %j as %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("caps the length without trailing dashes", () => {
    const slug = slugify(`${"word ".repeat(40)}end`);

    expect(slug.length).toBeLessThanOrEqual(96);
    expect(slug.endsWith("-")).toBeFalsy();
  });
});

describe(renderDocument, () => {
  const document = {
    content: [
      {
        attrs: { level: 2 },
        content: [{ text: "Intro", type: "text" }],
        type: "heading",
      },
      {
        content: [
          { text: "Read the ", type: "text" },
          {
            marks: [{ attrs: { href: "https://hono.dev" }, type: "link" }],
            text: "docs",
            type: "text",
          },
          { text: ".", type: "text" },
        ],
        type: "paragraph",
      },
      {
        attrs: { alt: "Diagram", mediaId: "m-1", src: "/media/a.png" },
        type: "image",
      },
    ],
    type: "doc" as const,
  };

  it("renders semantic HTML with safe links and media references", () => {
    const { html } = renderDocument(document);

    expect(html).toContain("<h2>Intro</h2>");
    expect(html).toContain('href="https://hono.dev"');
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain('data-media-id="m-1"');
  });

  it("renders Markdown for AI-readable alternates", () => {
    const { markdown } = renderDocument(document);

    expect(markdown).toContain("## Intro");
    expect(markdown).toContain("[docs](https://hono.dev)");
  });

  it("escapes text content", () => {
    const { html } = renderDocument({
      content: [
        {
          content: [{ text: "<script>alert(1)</script>", type: "text" }],
          type: "paragraph",
        },
      ],
      type: "doc",
    });

    expect(html).not.toContain("<script>");
  });
});

describe(readingTime, () => {
  it("never reports less than a minute and rounds up", () => {
    expect(readingTime("")).toBe(1);
    expect(readingTime("word ".repeat(221))).toBe(2);
  });
});
