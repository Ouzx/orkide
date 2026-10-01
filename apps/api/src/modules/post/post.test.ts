import { describe, expect, it } from "vitest";

import { jsonRequest, request, signInAs } from "../../../test/helpers.ts";

const paragraph = (text: string) => ({
  content: [{ content: [{ text, type: "text" }], type: "paragraph" }],
  type: "doc" as const,
});

const postInput = (overrides: Record<string, unknown> = {}) => ({
  status: "published",
  translations: [
    {
      content: paragraph("Edge-first engineering."),
      locale: "en",
      slug: "hello-edge",
      summary: "Why the edge.",
      title: "Hello, edge",
    },
    {
      content: paragraph("Uç noktada mühendislik."),
      locale: "tr",
      slug: "merhaba-uc",
      summary: "Neden uç nokta.",
      title: "Merhaba, uç",
    },
  ],
  ...overrides,
});

const fetchPage = async (path: string) => {
  const response = await request(path);
  return response.json<{
    items: { slug: string }[];
    nextCursor: string | null;
  }>();
};

describe("posts", () => {
  it("lets an editor publish and readers fetch it per locale", async () => {
    const { cookie } = await signInAs("editor");
    const created = await jsonRequest("/api/admin/posts", "POST", postInput(), {
      cookie,
    });

    expect(created.status).toBe(201);

    const list = await request("/api/posts?locale=tr");
    const page = await list.json<{
      items: { slug: string; alternates: unknown[] }[];
    }>();

    expect(page.items).toMatchObject([
      { alternates: [{ locale: "en" }, { locale: "tr" }], slug: "merhaba-uc" },
    ]);

    const detail = await request("/api/posts/hello-edge?locale=en");
    const body = await detail.json<{
      html: string;
      readingTimeMinutes: number;
    }>();

    expect({ ...body, status: detail.status }).toMatchObject({
      html: "<p>Edge-first engineering.</p>",
      readingTimeMinutes: 1,
      status: 200,
    });
  });

  it("does not serve drafts to readers", async () => {
    const { cookie } = await signInAs("editor");
    await jsonRequest(
      "/api/admin/posts",
      "POST",
      postInput({ status: "draft" }),
      { cookie }
    );

    const response = await request("/api/posts/hello-edge?locale=en");

    expect(response.status).toBe(404);
  });

  it("reports duplicate slugs as a conflict", async () => {
    const { cookie } = await signInAs("owner");
    await jsonRequest("/api/admin/posts", "POST", postInput(), { cookie });

    const duplicate = await jsonRequest(
      "/api/admin/posts",
      "POST",
      postInput(),
      { cookie }
    );

    expect(duplicate.status).toBe(409);
    await expect(duplicate.json()).resolves.toMatchObject({ code: "conflict" });
  });

  it("enforces RBAC on admin routes", async () => {
    const anonymous = await jsonRequest(
      "/api/admin/posts",
      "POST",
      postInput()
    );
    const { cookie } = await signInAs("viewer");
    const viewer = await jsonRequest("/api/admin/posts", "POST", postInput(), {
      cookie,
    });

    expect(anonymous.status).toBe(401);
    expect(viewer.status).toBe(403);
  });

  it("rejects unsafe links with field-level issues", async () => {
    const { cookie } = await signInAs("owner");
    const unsafeLink = {
      content: [
        {
          // oxlint-disable-next-line no-script-url -- the payload under test.
          marks: [{ attrs: { href: "javascript:alert(1)" }, type: "link" }],
          text: "x",
          type: "text",
        },
      ],
      type: "paragraph",
    };
    const input = postInput({
      translations: [
        {
          content: { content: [unsafeLink], type: "doc" },
          locale: "en",
          slug: "unsafe",
          summary: "S",
          title: "T",
        },
      ],
    });

    const response = await jsonRequest("/api/admin/posts", "POST", input, {
      cookie,
    });
    const problem = await response.json<{
      code: string;
      issues: { path: unknown[] }[];
    }>();

    expect(response.status).toBe(422);
    expect(problem.code).toBe("validation_failed");
    expect(problem.issues[0]?.path).toStrictEqual([
      "translations",
      0,
      "content",
      "content",
    ]);
  });

  it("paginates with an opaque keyset cursor", async () => {
    const { cookie } = await signInAs("owner");
    for (const index of [1, 2, 3]) {
      // oxlint-disable-next-line no-await-in-loop -- sequential inserts give distinct publish times.
      await jsonRequest(
        "/api/admin/posts",
        "POST",
        postInput({
          translations: [
            {
              content: paragraph("Body"),
              locale: "en",
              slug: `post-${index}`,
              summary: "S",
              title: `Post ${index}`,
            },
          ],
        }),
        { cookie }
      );
    }

    const first = await fetchPage("/api/posts?locale=en&limit=2");
    const second = await fetchPage(
      `/api/posts?locale=en&limit=2&cursor=${first.nextCursor}`
    );

    expect(first.items.map((item) => item.slug)).toStrictEqual([
      "post-3",
      "post-2",
    ]);
    expect(second.items.map((item) => item.slug)).toStrictEqual(["post-1"]);
    expect(second.nextCursor).toBeNull();
  });
});
