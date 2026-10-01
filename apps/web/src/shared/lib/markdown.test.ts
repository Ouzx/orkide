import { describe, expect, it } from "vitest";

import {
  markdownAlternate,
  markdownResponse,
  parseDocumentParam,
} from "./markdown.ts";

const request = (path: string, accept?: string) =>
  new Request(`https://example.com${path}`, {
    headers: accept ? { accept } : {},
  });

describe("markdown negotiation", () => {
  it("rewrites document pages for clients that prefer Markdown", () => {
    const rewritten = markdownAlternate(
      request("/blog/hello", "text/markdown, text/html;q=0.5")
    );

    expect(rewritten?.url).toBe("https://example.com/blog/hello.md");
  });

  it("keeps HTML when the browser prefers it or the path is not a document", () => {
    expect(
      markdownAlternate(request("/blog/hello", "text/html,text/markdown;q=0.5"))
    ).toBeUndefined();
    expect(markdownAlternate(request("/blog/hello"))).toBeUndefined();
    expect(
      markdownAlternate(request("/blog", "text/markdown"))
    ).toBeUndefined();
  });

  it("splits the .md suffix from a document param", () => {
    expect(parseDocumentParam("hello.md")).toStrictEqual({
      markdown: true,
      slug: "hello",
    });
    expect(parseDocumentParam("hello")).toStrictEqual({
      markdown: false,
      slug: "hello",
    });
  });

  it("renders a self-describing Markdown document", async () => {
    const response = markdownResponse(
      {
        markdown: "Body",
        publishedAt: "2026-10-01T00:00:00.000Z",
        summary: "Summary",
        title: "Title",
        updatedAt: "2026-10-02T00:00:00.000Z",
      },
      "https://example.com/en/blog/title"
    );

    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(response.headers.get("vary")).toBe("accept");
    await expect(response.text()).resolves.toMatch(
      /^# Title\n\n> Summary\n\nSource: https:\/\/example\.com\/en\/blog\/title/u
    );
  });
});
