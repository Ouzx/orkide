import { describe, expect, it } from "vitest";

import { onSite } from "./site.ts";

describe(onSite, () => {
  it("keeps the path and query on the public origin", () => {
    expect(
      onSite(new URL("https://web.example.workers.dev/en/blog?page=2")).href
    ).toBe("https://example.com/en/blog?page=2");
  });

  it("never leaves the origin for a path that starts with two slashes", () => {
    const target = onSite(
      new URL("https://web.example.workers.dev//evil.example/login")
    );
    expect(target.origin).toBe("https://example.com");
    expect(target.pathname).toBe("//evil.example/login");
  });
});
