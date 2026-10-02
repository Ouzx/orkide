import { describe, expect, it } from "vitest";

import { forwardToApi } from "./forward.ts";

describe(forwardToApi, () => {
  it("keeps the client IP on the forwarded request", async () => {
    const original = new Request("https://orkide.dev/api/contact", {
      body: "{}",
      headers: {
        "cf-connecting-ip": "203.0.113.7",
        "content-type": "application/json",
      },
      method: "POST",
    });

    const forwarded = forwardToApi(original);

    expect(forwarded.headers.get("cf-connecting-ip")).toBe("203.0.113.7");
    expect(forwarded.method).toBe("POST");
    expect(forwarded.headers.get("content-type")).toBe("application/json");
    await expect(forwarded.text()).resolves.toBe("{}");
  });

  it("never invents an IP for requests that carry none", () => {
    const original = new Request("https://orkide.dev/api/posts");

    expect(forwardToApi(original).headers.has("cf-connecting-ip")).toBeFalsy();
  });
});
