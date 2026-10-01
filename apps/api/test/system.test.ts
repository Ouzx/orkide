import { describe, expect, it } from "vitest";

import { request } from "./helpers.ts";

describe("system routes", () => {
  it("reports a healthy database", async () => {
    const response = await request("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      database: "ok",
      status: "ok",
    });
  });

  it("serves an OpenAPI 3.1 document", async () => {
    const response = await request("/api/openapi.json");
    const document = await response.json<{
      openapi: string;
      paths: Record<string, unknown>;
    }>();

    expect(document.openapi).toBe("3.1.0");
    expect(Object.keys(document.paths)).toContain("/api/health");
  });

  it("returns localized RFC 9457 problems", async () => {
    const response = await request("/api/does-not-exist", {
      headers: { "accept-language": "tr" },
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json"
    );
    await expect(response.json()).resolves.toMatchObject({
      code: "not_found",
      status: 404,
      title: "İstenen kaynak bulunamadı.",
    });
  });

  it("applies strict security headers", async () => {
    const response = await request("/api/health");

    expect(response.headers.get("content-security-policy")).toBe(
      "default-src 'none'; frame-ancestors 'none'"
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("rejects cross-origin state-changing requests", async () => {
    const response = await request("/api/health", {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://evil.example",
      },
      method: "POST",
    });

    expect(response.status).toBe(403);
  });
});

describe("http caching", () => {
  it("shares reader responses only when the locale is explicit in the URL", async () => {
    const explicit = await request("/api/posts?locale=en");
    const negotiated = await request("/api/posts", {
      headers: { "accept-language": "tr" },
    });

    expect(explicit.headers.get("cache-control")).toContain("s-maxage");
    expect(explicit.headers.get("cache-tag")).toBe("posts");
    expect(negotiated.headers.get("cache-control")).toBe("private, no-store");
  });

  it("never stores responses that did not opt in", async () => {
    const health = await request("/api/health");
    const admin = await request("/api/admin/posts");

    expect(health.headers.get("cache-control")).toBe("no-store");
    expect(admin.headers.get("cache-control")).toBe("private, no-store");
  });
});
