import { createRoute, z } from "@hono/zod-openapi";
import { idSchema, localeSchema, slugSchema } from "@orkide/validators/common";
import {
  projectDetailSchema,
  projectInputSchema,
  projectRecordSchema,
  projectSummarySchema,
} from "@orkide/validators/content";

import { shareable } from "../../core/cache.ts";
import { createRouter } from "../../core/factory.ts";
import {
  assertPermission,
  requirePermission,
} from "../../core/middleware/auth.ts";
import { json, problems } from "../../core/responses.ts";
import * as service from "./project.service.ts";

const ProjectSummary = projectSummarySchema.openapi("ProjectSummary");
const ProjectDetail = projectDetailSchema.openapi("ProjectDetail");
const ProjectRecord = projectRecordSchema.openapi("ProjectRecord");
const ProjectInput = projectInputSchema.openapi("ProjectInput");

const localeQuery = z.object({ locale: localeSchema.optional() });
const idParams = z.object({
  id: idSchema.openapi({ param: { in: "path", name: "id" } }),
});
const slugParams = z.object({
  slug: slugSchema.openapi({ param: { in: "path", name: "slug" } }),
});
const admin = { security: [{ session: [] }], tags: ["Admin · Projects"] };
const body = {
  content: { "application/json": { schema: ProjectInput } },
  required: true,
};
const PUBLISHING_STATUSES = new Set(["published", "scheduled"]);

const list = createRoute({
  method: "get",
  middleware: [shareable("projects")] as const,
  path: "/projects",
  request: { query: localeQuery },
  responses: { 200: json(z.array(ProjectSummary), "Published projects") },
  summary: "List published projects",
  tags: ["Projects"],
});

const read = createRoute({
  method: "get",
  middleware: [shareable("projects")] as const,
  path: "/projects/{slug}",
  request: { params: slugParams, query: localeQuery },
  responses: { 200: json(ProjectDetail, "The project"), ...problems(404) },
  summary: "Get a published project by slug",
  tags: ["Projects"],
});

const adminList = createRoute({
  ...admin,
  method: "get",
  middleware: [requirePermission({ project: ["read"] })] as const,
  path: "/admin/projects",
  responses: {
    200: json(z.array(ProjectRecord), "Every project"),
    ...problems(401, 403),
  },
  summary: "List all projects",
});

const adminRead = createRoute({
  ...admin,
  method: "get",
  middleware: [requirePermission({ project: ["read"] })] as const,
  path: "/admin/projects/{id}",
  request: { params: idParams },
  responses: {
    200: json(ProjectRecord, "The project"),
    ...problems(401, 403, 404),
  },
  summary: "Get a project for editing",
});

const create = createRoute({
  ...admin,
  method: "post",
  middleware: [requirePermission({ project: ["create"] })] as const,
  path: "/admin/projects",
  request: { body },
  responses: {
    201: json(ProjectRecord, "Created"),
    ...problems(401, 403, 409, 422),
  },
  summary: "Create a project",
});

const update = createRoute({
  ...admin,
  method: "put",
  middleware: [requirePermission({ project: ["update"] })] as const,
  path: "/admin/projects/{id}",
  request: { body, params: idParams },
  responses: {
    200: json(ProjectRecord, "Updated"),
    ...problems(401, 403, 404, 409, 422),
  },
  summary: "Replace a project",
});

const remove = createRoute({
  ...admin,
  method: "delete",
  middleware: [requirePermission({ project: ["delete"] })] as const,
  path: "/admin/projects/{id}",
  request: { params: idParams },
  responses: { 204: { description: "Deleted" }, ...problems(401, 403, 404) },
  summary: "Delete a project",
});

export const projectRoutes = createRouter()
  .openapi(list, async (c) =>
    c.json(await service.listPublished(c.var.language), 200)
  )
  .openapi(read, async (c) =>
    c.json(
      await service.getPublished(c.var.language, c.req.valid("param").slug),
      200
    )
  )
  .openapi(adminList, async (c) => c.json(await service.listAll(), 200))
  .openapi(adminRead, async (c) =>
    c.json(await service.getById(c.req.valid("param").id), 200)
  )
  .openapi(create, async (c) => {
    const input = c.req.valid("json");
    if (PUBLISHING_STATUSES.has(input.status ?? "draft")) {
      assertPermission(c.var.user, { project: ["publish"] });
    }
    return c.json(await service.create(input), 201);
  })
  .openapi(update, async (c) => {
    const input = c.req.valid("json");
    if (PUBLISHING_STATUSES.has(input.status ?? "draft")) {
      assertPermission(c.var.user, { project: ["publish"] });
    }
    return c.json(await service.update(c.req.valid("param").id, input), 200);
  })
  .openapi(remove, async (c) => {
    await service.remove(c.req.valid("param").id);
    return c.body(null, 204);
  });
