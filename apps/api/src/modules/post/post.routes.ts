import { createRoute, z } from "@hono/zod-openapi";
import {
  idSchema,
  localeSchema,
  pageQuerySchema,
  pageSchema,
  slugSchema,
} from "@orkide/validators/common";
import {
  postDetailSchema,
  postInputSchema,
  postListQuerySchema,
  postRecordSchema,
  postSummarySchema,
} from "@orkide/validators/content";

import { createRouter } from "../../core/factory.ts";
import {
  assertPermission,
  requirePermission,
} from "../../core/middleware/auth.ts";
import { json, problems, PUBLIC_CACHE_CONTROL } from "../../core/responses.ts";
import * as service from "./post.service.ts";

const PostSummary = postSummarySchema.openapi("PostSummary");
const PostDetail = postDetailSchema.openapi("PostDetail");
const PostRecord = postRecordSchema.openapi("PostRecord");
const PostInput = postInputSchema.openapi("PostInput");

const localeQuery = z.object({ locale: localeSchema.optional() });
const idParams = z.object({
  id: idSchema.openapi({ param: { in: "path", name: "id" } }),
});
const slugParams = z.object({
  slug: slugSchema.openapi({ param: { in: "path", name: "slug" } }),
});
const admin = { security: [{ session: [] }], tags: ["Admin · Posts"] };

const list = createRoute({
  method: "get",
  path: "/posts",
  request: {
    query: pageQuerySchema
      .extend(postListQuerySchema.shape)
      .extend(localeQuery.shape),
  },
  responses: {
    200: json(pageSchema(PostSummary).openapi("PostPage"), "A page of posts"),
    ...problems(400, 422),
  },
  summary: "List published posts",
  tags: ["Posts"],
});

const read = createRoute({
  method: "get",
  path: "/posts/{slug}",
  request: { params: slugParams, query: localeQuery },
  responses: { 200: json(PostDetail, "The post"), ...problems(404) },
  summary: "Get a published post by slug",
  tags: ["Posts"],
});

const adminList = createRoute({
  ...admin,
  method: "get",
  middleware: [requirePermission({ post: ["read"] })] as const,
  path: "/admin/posts",
  responses: {
    200: json(z.array(PostRecord), "Every post"),
    ...problems(401, 403),
  },
  summary: "List all posts",
});

const adminRead = createRoute({
  ...admin,
  method: "get",
  middleware: [requirePermission({ post: ["read"] })] as const,
  path: "/admin/posts/{id}",
  request: { params: idParams },
  responses: { 200: json(PostRecord, "The post"), ...problems(401, 403, 404) },
  summary: "Get a post for editing",
});

const create = createRoute({
  ...admin,
  method: "post",
  middleware: [requirePermission({ post: ["create"] })] as const,
  path: "/admin/posts",
  request: {
    body: {
      content: { "application/json": { schema: PostInput } },
      required: true,
    },
  },
  responses: { 201: json(PostRecord, "Created"), ...problems(401, 403, 422) },
  summary: "Create a post",
});

const update = createRoute({
  ...admin,
  method: "put",
  middleware: [requirePermission({ post: ["update"] })] as const,
  path: "/admin/posts/{id}",
  request: {
    body: {
      content: { "application/json": { schema: PostInput } },
      required: true,
    },
    params: idParams,
  },
  responses: {
    200: json(PostRecord, "Updated"),
    ...problems(401, 403, 404, 422),
  },
  summary: "Replace a post",
});

const remove = createRoute({
  ...admin,
  method: "delete",
  middleware: [requirePermission({ post: ["delete"] })] as const,
  path: "/admin/posts/{id}",
  request: { params: idParams },
  responses: { 204: { description: "Deleted" }, ...problems(401, 403, 404) },
  summary: "Delete a post",
});

/** Publishing (or scheduling) is a separate permission from editing. */
const PUBLISHING_STATUSES = new Set(["published", "scheduled"]);

export const postRoutes = createRouter()
  .openapi(list, async (c) => {
    const { locale: _locale, ...query } = c.req.valid("query");
    c.header("cache-control", PUBLIC_CACHE_CONTROL);
    c.header("vary", "accept-language, cookie");
    return c.json(
      await service.listPublished({ ...query, locale: c.var.language }),
      200
    );
  })
  .openapi(read, async (c) => {
    c.header("cache-control", PUBLIC_CACHE_CONTROL);
    c.header("vary", "accept-language, cookie");
    return c.json(
      await service.getPublished(c.var.language, c.req.valid("param").slug),
      200
    );
  })
  .openapi(adminList, async (c) => c.json(await service.listAll(), 200))
  .openapi(adminRead, async (c) =>
    c.json(await service.getById(c.req.valid("param").id), 200)
  )
  .openapi(create, async (c) => {
    const input = c.req.valid("json");
    const { user } = c.var;
    assertPermission(
      user,
      PUBLISHING_STATUSES.has(input.status ?? "draft")
        ? { post: ["publish"] }
        : {}
    );
    return c.json(await service.create(input, user.id), 201);
  })
  .openapi(update, async (c) => {
    const input = c.req.valid("json");
    if (PUBLISHING_STATUSES.has(input.status ?? "draft")) {
      assertPermission(c.var.user, { post: ["publish"] });
    }
    return c.json(await service.update(c.req.valid("param").id, input), 200);
  })
  .openapi(remove, async (c) => {
    await service.remove(c.req.valid("param").id);
    return c.body(null, 204);
  });
