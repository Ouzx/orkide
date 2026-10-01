import { createRoute, z } from "@hono/zod-openapi";
import { idSchema, localeSchema } from "@orkide/validators/common";
import {
  categoryInputSchema,
  tagInputSchema,
  taxonomyRecordSchema,
  termSchema,
} from "@orkide/validators/taxonomy";

import { shareable } from "../../core/cache.ts";
import { createRouter } from "../../core/factory.ts";
import { requirePermission } from "../../core/middleware/auth.ts";
import { json, problems } from "../../core/responses.ts";
import * as service from "./taxonomy.service.ts";

const Term = termSchema.openapi("Term");
const CategoryInput = categoryInputSchema.openapi("CategoryInput");
const TagInput = tagInputSchema.openapi("TagInput");
const TaxonomyRecord = taxonomyRecordSchema.openapi("TaxonomyRecord");

const idParams = z.object({
  id: idSchema.openapi({ param: { in: "path", name: "id" } }),
});
const created = json(z.object({ id: idSchema }), "Created");
const categoryBody = {
  content: { "application/json": { schema: CategoryInput } },
  required: true,
};
const tagBody = {
  content: { "application/json": { schema: TagInput } },
  required: true,
};
const admin = { security: [{ session: [] }], tags: ["Admin · Taxonomy"] };

const publicList = createRoute({
  method: "get",
  middleware: [shareable("taxonomy")] as const,
  path: "/taxonomy",
  request: { query: z.object({ locale: localeSchema.optional() }) },
  responses: {
    200: json(
      z.object({ categories: z.array(Term), tags: z.array(Term) }),
      "Localized categories and tags"
    ),
  },
  summary: "List categories and tags",
  tags: ["Taxonomy"],
});

const adminList = createRoute({
  ...admin,
  method: "get",
  middleware: [requirePermission({ taxonomy: ["read"] })] as const,
  path: "/admin/taxonomy",
  responses: {
    200: json(TaxonomyRecord, "Every term with all translations"),
    ...problems(401, 403),
  },
  summary: "List terms for editing",
});

const createCategory = createRoute({
  ...admin,
  method: "post",
  middleware: [requirePermission({ taxonomy: ["create"] })] as const,
  path: "/admin/taxonomy/categories",
  request: { body: categoryBody },
  responses: { 201: created, ...problems(401, 403, 409, 422) },
  summary: "Create a category",
});

const updateCategory = createRoute({
  ...admin,
  method: "put",
  middleware: [requirePermission({ taxonomy: ["update"] })] as const,
  path: "/admin/taxonomy/categories/{id}",
  request: { body: categoryBody, params: idParams },
  responses: {
    204: { description: "Updated" },
    ...problems(401, 403, 409, 422),
  },
  summary: "Replace a category",
});

const removeCategory = createRoute({
  ...admin,
  method: "delete",
  middleware: [requirePermission({ taxonomy: ["delete"] })] as const,
  path: "/admin/taxonomy/categories/{id}",
  request: { params: idParams },
  responses: { 204: { description: "Deleted" }, ...problems(401, 403, 404) },
  summary: "Delete a category",
});

const createTag = createRoute({
  ...admin,
  method: "post",
  middleware: [requirePermission({ taxonomy: ["create"] })] as const,
  path: "/admin/taxonomy/tags",
  request: { body: tagBody },
  responses: { 201: created, ...problems(401, 403, 409, 422) },
  summary: "Create a tag",
});

const updateTag = createRoute({
  ...admin,
  method: "put",
  middleware: [requirePermission({ taxonomy: ["update"] })] as const,
  path: "/admin/taxonomy/tags/{id}",
  request: { body: tagBody, params: idParams },
  responses: {
    204: { description: "Updated" },
    ...problems(401, 403, 409, 422),
  },
  summary: "Replace a tag",
});

const removeTag = createRoute({
  ...admin,
  method: "delete",
  middleware: [requirePermission({ taxonomy: ["delete"] })] as const,
  path: "/admin/taxonomy/tags/{id}",
  request: { params: idParams },
  responses: { 204: { description: "Deleted" }, ...problems(401, 403, 404) },
  summary: "Delete a tag",
});

export const taxonomyRoutes = createRouter()
  .openapi(publicList, async (c) =>
    c.json(await service.listPublic(c.var.language), 200)
  )
  .openapi(adminList, async (c) => c.json(await service.listEditable(), 200))
  .openapi(createCategory, async (c) =>
    c.json({ id: await service.createCategory(c.req.valid("json")) }, 201)
  )
  .openapi(updateCategory, async (c) => {
    await service.updateCategory(c.req.valid("param").id, c.req.valid("json"));
    return c.body(null, 204);
  })
  .openapi(removeCategory, async (c) => {
    await service.removeCategory(c.req.valid("param").id);
    return c.body(null, 204);
  })
  .openapi(createTag, async (c) =>
    c.json({ id: await service.createTag(c.req.valid("json")) }, 201)
  )
  .openapi(updateTag, async (c) => {
    await service.updateTag(c.req.valid("param").id, c.req.valid("json"));
    return c.body(null, 204);
  })
  .openapi(removeTag, async (c) => {
    await service.removeTag(c.req.valid("param").id);
    return c.body(null, 204);
  });
