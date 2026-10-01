import { describe, expect, it } from "vitest";

import {
  getJson,
  jsonRequest,
  request,
  signInAs,
} from "../../../test/helpers.ts";

const term = (en: string, tr: string) => ({
  translations: [
    { locale: "en", name: en, slug: en.toLowerCase() },
    { locale: "tr", name: tr, slug: tr.toLowerCase() },
  ],
});

const paragraph = (text: string) => ({
  content: [{ content: [{ text, type: "text" }], type: "paragraph" }],
  type: "doc",
});

describe("taxonomy", () => {
  it("serves localized terms and filters posts by them", async () => {
    const { cookie } = await signInAs("owner");
    const createdCategory = await jsonRequest(
      "/api/admin/taxonomy/categories",
      "POST",
      { ...term("Engineering", "Muhendislik"), position: 0 },
      { cookie }
    );
    const createdTag = await jsonRequest(
      "/api/admin/taxonomy/tags",
      "POST",
      term("Edge", "Uc"),
      { cookie }
    );
    const { id: categoryId } = await createdCategory.json<{ id: string }>();
    const { id: tagId } = await createdTag.json<{ id: string }>();

    await jsonRequest(
      "/api/admin/posts",
      "POST",
      {
        categoryId,
        status: "published",
        tagIds: [tagId],
        translations: [
          {
            content: paragraph("Body"),
            locale: "tr",
            slug: "etiketli",
            summary: "S",
            title: "Etiketli",
          },
        ],
      },
      { cookie }
    );

    const terms = await getJson("/api/taxonomy?locale=tr");
    const byTag = await getJson<{ items: { category: unknown }[] }>(
      "/api/posts?locale=tr&tag=uc"
    );
    const byOtherTag = await getJson<{ items: unknown[] }>(
      "/api/posts?locale=tr&tag=yok"
    );

    expect(terms).toMatchObject({
      categories: [{ name: "Muhendislik" }],
      tags: [{ slug: "uc" }],
    });
    expect(byTag.items).toMatchObject([{ category: { slug: "muhendislik" } }]);
    expect(byOtherTag.items).toHaveLength(0);
  });

  it("lets editors create but not delete terms", async () => {
    const { cookie } = await signInAs("editor");
    const created = await jsonRequest(
      "/api/admin/taxonomy/tags",
      "POST",
      term("Hono", "Hono"),
      { cookie }
    );
    const { id } = await created.json<{ id: string }>();
    const removed = await request(`/api/admin/taxonomy/tags/${id}`, {
      headers: { cookie, origin: "http://localhost:4321" },
      method: "DELETE",
    });

    expect(created.status).toBe(201);
    expect(removed.status).toBe(403);
  });
});

const project = (slug: string, featured: boolean) => ({
  featured,
  status: "published",
  translations: [
    {
      content: paragraph("Body"),
      locale: "en",
      slug,
      summary: "S",
      title: slug,
    },
  ],
});

describe("projects", () => {
  it("lists featured projects first", async () => {
    const { cookie } = await signInAs("owner");
    await jsonRequest(
      "/api/admin/projects",
      "POST",
      project("regular", false),
      { cookie }
    );
    await jsonRequest(
      "/api/admin/projects",
      "POST",
      project("flagship", true),
      { cookie }
    );

    const list = await getJson<{ slug: string }[]>("/api/projects?locale=en");

    expect(list.map((item) => item.slug)).toStrictEqual([
      "flagship",
      "regular",
    ]);
  });
});

describe("taxonomy RBAC", () => {
  it("forbids viewers from creating terms", async () => {
    const { cookie } = await signInAs("viewer");

    const category = await jsonRequest(
      "/api/admin/taxonomy/categories",
      "POST",
      { ...term("Nope", "Hayir"), position: 0 },
      { cookie }
    );
    const tag = await jsonRequest(
      "/api/admin/taxonomy/tags",
      "POST",
      term("Nope", "Hayir"),
      { cookie }
    );

    expect([category.status, tag.status]).toStrictEqual([403, 403]);
  });
});
