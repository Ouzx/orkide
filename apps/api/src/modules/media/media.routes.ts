import { createRoute, z } from "@hono/zod-openapi";
import {
  idSchema,
  isoDateSchema,
  localeSchema,
} from "@orkide/validators/common";
import {
  mediaSchema,
  mediaTranslationInputSchema,
  mediaUpdateSchema,
} from "@orkide/validators/media";

import { ApiError, toIssues } from "../../core/errors.ts";
import { createRouter } from "../../core/factory.ts";
import { requirePermission } from "../../core/middleware/auth.ts";
import { rateLimit } from "../../core/middleware/rate-limit.ts";
import { uploadedFile } from "../../core/middleware/upload.ts";
import { json, problems } from "../../core/responses.ts";
import * as service from "./media.service.ts";

const Media = mediaSchema.openapi("Media");
const MediaUpdate = mediaUpdateSchema.openapi("MediaUpdate");
const MediaRecord = mediaSchema
  .omit({ alt: true, caption: true, url: true })
  .extend({
    createdAt: isoDateSchema,
    key: z.string(),
    sha256: z.string(),
    translations: z.array(mediaTranslationInputSchema),
    updatedAt: isoDateSchema,
    uploaderId: idSchema.nullable(),
  })
  .openapi("MediaRecord");

/** `<sha256>.<extension>` — the only shape a stored object name can take. */
const fileParam = z
  .string()
  .regex(/^[\da-f]{64}\.[a-z\d]{2,5}$/u)
  .openapi({
    example: `${"a".repeat(64)}.webp`,
    param: { in: "path", name: "file" },
  });
const idParams = z.object({
  id: idSchema.openapi({ param: { in: "path", name: "id" } }),
});
const admin = { security: [{ session: [] }], tags: ["Admin · Media"] };

const translationsField = z.array(mediaTranslationInputSchema).default([]);

const serve = createRoute({
  description:
    "Images are resized to the nearest allowed width, converted to the best format the client accepts and stripped of metadata. Other files stream with Range support.",
  method: "get",
  path: "/media/{file}",
  request: {
    params: z.object({ file: fileParam }),
    query: z.object({
      w: z.coerce.number().int().positive().max(4096).optional(),
    }),
  },
  responses: {
    200: { description: "The file or image variant" },
    206: { description: "Partial content" },
    304: { description: "Not modified" },
    ...problems(404),
  },
  summary: "Serve a stored file",
  tags: ["Media"],
});

const adminList = createRoute({
  ...admin,
  method: "get",
  middleware: [requirePermission({ media: ["read"] })] as const,
  path: "/admin/media",
  request: { query: z.object({ locale: localeSchema.optional() }) },
  responses: {
    200: json(z.array(MediaRecord), "Every media item"),
    ...problems(401, 403),
  },
  summary: "List media",
});

const upload = createRoute({
  ...admin,
  description:
    "Multipart upload. `translations` is an optional JSON array of localized alt text and captions.",
  method: "post",
  middleware: [
    requirePermission({ media: ["upload"] }),
    rateLimit("RATE_LIMIT_STRICT", "upload"),
    uploadedFile(),
  ] as const,
  path: "/admin/media",
  responses: {
    200: json(Media, "Identical file already stored"),
    201: json(Media, "Stored"),
    ...problems(400, 401, 403, 413, 415, 422, 429),
  },
  summary: "Upload a file",
});

const update = createRoute({
  ...admin,
  method: "put",
  middleware: [requirePermission({ media: ["update"] })] as const,
  path: "/admin/media/{id}",
  request: {
    body: {
      content: { "application/json": { schema: MediaUpdate } },
      required: true,
    },
    params: idParams,
  },
  responses: {
    204: { description: "Updated" },
    ...problems(401, 403, 404, 422),
  },
  summary: "Update alt text and captions",
});

const remove = createRoute({
  ...admin,
  method: "delete",
  middleware: [requirePermission({ media: ["delete"] })] as const,
  path: "/admin/media/{id}",
  request: { params: idParams },
  responses: { 204: { description: "Deleted" }, ...problems(401, 403, 404) },
  summary: "Delete a file and all its variants",
});

/** Parses the optional `translations` form field of an upload. */
const parseTranslations = (raw: string | undefined) => {
  let value: unknown = [];
  try {
    value = raw === undefined ? [] : JSON.parse(raw);
  } catch (error) {
    throw new ApiError("bad_request", {
      cause: error,
      detail: "`translations` must be JSON.",
    });
  }
  const result = translationsField.safeParse(value);
  if (!result.success) {
    throw new ApiError("validation_failed", { issues: toIssues(result.error) });
  }
  return result.data;
};

export const mediaRoutes = createRouter()
  .openapi(serve, (c) =>
    service.serve(c.req.valid("param").file, {
      request: c.req.raw,
      waitUntil: (promise) => c.executionCtx.waitUntil(promise),
      width: c.req.valid("query").w,
    })
  )
  .openapi(adminList, async (c) => c.json(await service.listEditable(), 200))
  .openapi(upload, async (c) => {
    const { upload: file, user } = c.var;
    if (!user) {
      throw new ApiError("unauthorized");
    }
    const result = await service.upload(
      file,
      user.id,
      parseTranslations(file.fields.translations),
      c.var.language
    );
    return result.created
      ? c.json(result.media, 201)
      : c.json(result.media, 200);
  })
  .openapi(update, async (c) => {
    await service.updateTranslations(
      c.req.valid("param").id,
      c.req.valid("json")
    );
    return c.body(null, 204);
  })
  .openapi(remove, async (c) => {
    await service.remove(c.req.valid("param").id);
    return c.body(null, 204);
  });
