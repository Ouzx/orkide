import { describe, expect, it } from "vitest";

import {
  getJson,
  jsonRequest,
  request,
  signInAs,
} from "../../../test/helpers.ts";

const hero = {
  contactCta: "Say hello",
  eyebrow: "Engineer",
  lead: "I build things for the web.",
  title: "Hello, web.",
  workCta: "Work",
};

describe("site content", () => {
  it("serves only the sections that were edited, per locale", async () => {
    const { cookie } = await signInAs("owner");
    await expect(getJson("/api/site?locale=en")).resolves.toStrictEqual({});

    const saved = await jsonRequest(
      "/api/admin/site/hero?locale=en",
      "PUT",
      hero,
      { cookie }
    );

    expect(saved.status).toBe(204);
    expect(saved.headers.get("orkide-purge-tags")).toBe("site");
    await expect(getJson("/api/site?locale=en")).resolves.toStrictEqual({
      hero,
    });
    await expect(getJson("/api/site?locale=tr")).resolves.toStrictEqual({});
  });

  it("gives the editor every section: saved or shipped content, and its schema", async () => {
    const { cookie } = await signInAs("owner");
    const response = await request("/api/admin/site?locale=tr", {
      headers: { cookie },
    });
    const sections =
      await response.json<
        Record<
          string,
          { content: unknown; savedAt: string | null; schema: object }
        >
      >();

    expect(Object.keys(sections)).toStrictEqual(["hero"]);
    expect(sections.hero).toMatchObject({
      content: { workCta: "İşleri gör" },
      savedAt: null,
      schema: { properties: { title: { type: "string" } }, type: "object" },
    });
  });

  it("rejects content that does not fit the section", async () => {
    const { cookie } = await signInAs("owner");
    const response = await jsonRequest(
      "/api/admin/site/hero?locale=en",
      "PUT",
      { ...hero, title: " " },
      { cookie }
    );
    const problem = await response.json<{ issues: { path: unknown[] }[] }>();

    expect(response.status).toBe(422);
    expect(problem.issues.map((issue) => issue.path.join("."))).toStrictEqual([
      "title",
    ]);
  });

  it("resets a section to the shipped content", async () => {
    const { cookie } = await signInAs("editor");
    await jsonRequest("/api/admin/site/hero?locale=en", "PUT", hero, {
      cookie,
    });

    const reset = await request("/api/admin/site/hero?locale=en", {
      headers: { cookie, origin: "http://localhost:4321" },
      method: "DELETE",
    });
    const again = await request("/api/admin/site/hero?locale=en", {
      headers: { cookie, origin: "http://localhost:4321" },
      method: "DELETE",
    });

    expect(reset.status).toBe(204);
    expect(again.status).toBe(404);
    await expect(getJson("/api/site?locale=en")).resolves.toStrictEqual({});
  });

  it("lets viewers read but not edit, and nobody edit signed out", async () => {
    const { cookie } = await signInAs("viewer");
    const read = await request("/api/admin/site?locale=en", {
      headers: { cookie },
    });
    const write = await jsonRequest(
      "/api/admin/site/hero?locale=en",
      "PUT",
      hero,
      { cookie }
    );
    const anonymous = await jsonRequest(
      "/api/admin/site/hero?locale=en",
      "PUT",
      hero
    );

    expect(read.status).toBe(200);
    expect(write.status).toBe(403);
    expect(anonymous.status).toBe(401);
  });
});
