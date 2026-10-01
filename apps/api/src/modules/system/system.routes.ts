import { createRoute, z } from "@hono/zod-openapi";
import { db } from "@orkide/db";
import { sql } from "drizzle-orm";

import { createRouter } from "../../core/factory.ts";
import { evaluatePublicFlags, flagRegistry } from "../../core/flags.ts";
import type { FlagKey } from "../../core/flags.ts";

const healthSchema = z
  .object({
    database: z.enum(["ok", "unavailable"]),
    status: z.enum(["ok", "degraded"]),
    timestamp: z.iso.datetime(),
  })
  .openapi("Health");

/** One boolean per registered flag, keyed by flag name (typed end to end for clients). */
const flagsSchema = z
  .object(
    Object.fromEntries(
      Object.keys(flagRegistry).map((key) => [key, z.boolean()])
    ) as Record<FlagKey, z.ZodBoolean>
  )
  .openapi("PublicFlags");

const health = createRoute({
  description: "Liveness and dependency status. Never cached.",
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: { "application/json": { schema: healthSchema } },
      description: "Service status",
    },
  },
  summary: "Health check",
  tags: ["System"],
});

const flags = createRoute({
  description: "Client-safe feature flags evaluated for the current visitor.",
  method: "get",
  path: "/flags",
  responses: {
    200: {
      content: { "application/json": { schema: flagsSchema } },
      description: "Public flags",
    },
  },
  summary: "Public feature flags",
  tags: ["System"],
});

export const systemRoutes = createRouter()
  .openapi(health, async (c) => {
    const database = await db
      .run(sql`select 1`)
      .then(() => "ok" as const)
      .catch(() => "unavailable" as const);
    c.header("cache-control", "no-store");
    return c.json(
      {
        database,
        status: database === "ok" ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
      },
      200
    );
  })
  .openapi(flags, async (c) => {
    c.header("cache-control", "private, max-age=30");
    return c.json(await evaluatePublicFlags({ locale: c.var.language }), 200);
  });
