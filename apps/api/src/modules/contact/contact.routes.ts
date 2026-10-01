import { createRoute, z } from "@hono/zod-openapi";
import {
  idSchema,
  isoDateSchema,
  localeSchema,
} from "@orkide/validators/common";
import {
  contactInputSchema,
  contactMessageStatusSchema,
  contactMessageUpdateSchema,
} from "@orkide/validators/contact";

import { createRouter } from "../../core/factory.ts";
import { requireFlag } from "../../core/flags.ts";
import { requirePermission } from "../../core/middleware/auth.ts";
import { rateLimit } from "../../core/middleware/rate-limit.ts";
import { json, problems } from "../../core/responses.ts";
import * as service from "./contact.service.ts";

const ContactInput = contactInputSchema.openapi("ContactInput");
const ContactMessage = z
  .object({
    body: z.string(),
    createdAt: isoDateSchema,
    email: z.email(),
    id: idSchema,
    locale: localeSchema,
    name: z.string(),
    status: contactMessageStatusSchema,
    subject: z.string().nullable(),
    updatedAt: isoDateSchema,
    userAgent: z.string().nullable(),
  })
  .openapi("ContactMessage");

const idParams = z.object({
  id: idSchema.openapi({ param: { in: "path", name: "id" } }),
});
const admin = { security: [{ session: [] }], tags: ["Admin · Inbox"] };

const submit = createRoute({
  description:
    "Requires a valid Turnstile token. The response does not wait for emails to be sent.",
  method: "post",
  middleware: [
    requireFlag("contact-form"),
    rateLimit("RATE_LIMIT_STRICT", "contact"),
  ] as const,
  path: "/contact",
  request: {
    body: {
      content: { "application/json": { schema: ContactInput } },
      required: true,
    },
  },
  responses: {
    202: json(z.object({ id: idSchema }), "Accepted"),
    ...problems(403, 422, 429, 503),
  },
  summary: "Send a message",
  tags: ["Contact"],
});

const inbox = createRoute({
  ...admin,
  method: "get",
  middleware: [requirePermission({ message: ["read"] })] as const,
  path: "/admin/messages",
  request: {
    query: z.object({ status: contactMessageStatusSchema.optional() }),
  },
  responses: {
    200: json(z.array(ContactMessage), "Messages, newest first"),
    ...problems(401, 403),
  },
  summary: "List contact messages",
});

const update = createRoute({
  ...admin,
  method: "patch",
  middleware: [requirePermission({ message: ["update"] })] as const,
  path: "/admin/messages/{id}",
  request: {
    body: {
      content: { "application/json": { schema: contactMessageUpdateSchema } },
      required: true,
    },
    params: idParams,
  },
  responses: {
    204: { description: "Updated" },
    ...problems(401, 403, 404, 422),
  },
  summary: "Mark a message as read, archived or spam",
});

const remove = createRoute({
  ...admin,
  method: "delete",
  middleware: [requirePermission({ message: ["delete"] })] as const,
  path: "/admin/messages/{id}",
  request: { params: idParams },
  responses: { 204: { description: "Deleted" }, ...problems(401, 403, 404) },
  summary: "Delete a message",
});

export const contactRoutes = createRouter()
  .openapi(submit, async (c) => {
    const id = await service.submit(c.req.valid("json"), {
      ip: c.req.header("cf-connecting-ip"),
      userAgent: c.req.header("user-agent"),
    });
    return c.json({ id }, 202);
  })
  .openapi(inbox, async (c) =>
    c.json(await service.list(c.req.valid("query").status), 200)
  )
  .openapi(update, async (c) => {
    await service.updateStatus(
      c.req.valid("param").id,
      c.req.valid("json").status
    );
    return c.body(null, 204);
  })
  .openapi(remove, async (c) => {
    await service.remove(c.req.valid("param").id);
    return c.body(null, 204);
  });
