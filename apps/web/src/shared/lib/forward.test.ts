import { describe, expect, it } from "vitest";

import { asVisitor, forwardToApi } from "./forward.ts";

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

describe(asVisitor, () => {
  it("passes the visitor's IP to the API call", () => {
    const visit = new Request("https://orkide.dev/en/blog/x", {
      headers: { "cf-connecting-ip": "203.0.113.7" },
    });

    expect(asVisitor(visit)).toStrictEqual({
      headers: { "cf-connecting-ip": "203.0.113.7" },
    });
  });

  it("adds nothing without a visitor IP", () => {
    expect(
      asVisitor(new Request("https://orkide.dev/en/blog/x"))
    ).toBeUndefined();
  });
});
