import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const request = (path: string, init?: RequestInit) =>
  exports.default.fetch(new Request(`http://localhost:4321${path}`, init));

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
