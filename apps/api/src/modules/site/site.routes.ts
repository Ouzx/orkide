import { createRoute, z } from "@hono/zod-openapi";
import { isoDateSchema, localeSchema } from "@orkide/validators/common";
import { siteBlocksSchema, siteKeySchema } from "@orkide/validators/site";

import { shareable } from "../../core/cache.ts";
import { createRouter } from "../../core/factory.ts";
import { requirePermission } from "../../core/middleware/auth.ts";
import { json, problems } from "../../core/responses.ts";
import * as service from "./site.service.ts";

const SiteBlocks = siteBlocksSchema.openapi("SiteBlocks");
const SiteSectionsForEditing = z
  .record(
    siteKeySchema,
    z.object({
      content: z.record(z.string(), z.unknown()),
      savedAt: isoDateSchema.nullable(),
      schema: z.record(z.string(), z.unknown()),
    })
  )
  .openapi("SiteSectionsForEditing");

const localeQuery = z.object({ locale: localeSchema });
const keyParams = z.object({
  key: siteKeySchema.openapi({ param: { in: "path", name: "key" } }),
});
const admin = { security: [{ session: [] }], tags: ["Admin · Site"] };

const read = createRoute({
  description:
    "Only the sections the admin has edited; the web app shows its shipped content for the rest.",
  method: "get",
  middleware: [shareable("site")] as const,
  path: "/site",
  request: { query: localeQuery },
  responses: {
    200: json(SiteBlocks, "Edited sections"),
  },
  summary: "Read the site's edited content",
  tags: ["Site"],
});

const readForEditing = createRoute({
  ...admin,
  method: "get",
  middleware: [requirePermission({ site: ["read"] })] as const,
  path: "/admin/site",
  request: { query: localeQuery },
  responses: {
    200: json(
      SiteSectionsForEditing,
      "Every section: its content (saved, else shipped), when it was saved and its JSON Schema"
    ),
    ...problems(401, 403),
  },
  summary: "Read every section of the site for editing",
});

const save = createRoute({
  ...admin,
  description: "The body is the section's content, validated by its schema.",
  method: "put",
  middleware: [requirePermission({ site: ["update"] })] as const,
  path: "/admin/site/{key}",
  request: {
    body: {
      content: { "application/json": { schema: z.unknown() } },
      required: true,
    },
    params: keyParams,
    query: localeQuery,
  },
  responses: {
    204: { description: "Saved" },
    ...problems(401, 403, 422),
  },
  summary: "Save a section",
});

const reset = createRoute({
  ...admin,
  method: "delete",
  middleware: [requirePermission({ site: ["update"] })] as const,
  path: "/admin/site/{key}",
  request: { params: keyParams, query: localeQuery },
  responses: {
    204: { description: "Reset to the shipped content" },
    ...problems(401, 403, 404),
  },
  summary: "Reset a section to the shipped content",
});

export const siteRoutes = createRouter()
  .openapi(read, async (c) =>
    c.json(await service.read(c.req.valid("query").locale), 200)
  )
  .openapi(readForEditing, async (c) =>
    c.json(await service.readForEditing(c.req.valid("query").locale), 200)
  )
  .openapi(save, async (c) => {
    await service.save(
      c.req.valid("param").key,
      c.req.valid("query").locale,
      c.req.valid("json")
    );
    return c.body(null, 204);
  })
  .openapi(reset, async (c) => {
    await service.reset(c.req.valid("param").key, c.req.valid("query").locale);
    return c.body(null, 204);
  });
