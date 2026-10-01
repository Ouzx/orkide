import { createRoute, z } from "@hono/zod-openapi";
import {
  statsOverviewSchema,
  statsRangeQuerySchema,
  trackEventSchema,
  webVitalNames,
} from "@orkide/validators/stats";

import { createRouter } from "../../core/factory.ts";
import { requirePermission } from "../../core/middleware/auth.ts";
import { json, problems } from "../../core/responses.ts";
import * as service from "./stats.service.ts";

const TrackEvent = trackEventSchema.openapi("TrackEvent");
const StatsOverview = statsOverviewSchema.openapi("StatsOverview");
const WebVitals = z
  .array(
    z.object({
      name: z.enum(webVitalNames),
      p75: z.number(),
      samples: z.number(),
    })
  )
  .openapi("WebVitals");

const track = createRoute({
  description:
    "Cookie-less beacon for page views and Web Vitals. Bots are ignored.",
  method: "post",
  path: "/track",
  request: {
    body: {
      content: { "application/json": { schema: TrackEvent } },
      required: true,
    },
  },
  responses: {
    204: { description: "Recorded (or ignored)" },
    ...problems(422, 429),
  },
  summary: "Record a page view or Web Vital",
  tags: ["Stats"],
});

const overview = createRoute({
  method: "get",
  middleware: [requirePermission({ stats: ["read"] })] as const,
  path: "/admin/stats",
  request: { query: statsRangeQuerySchema },
  responses: {
    200: json(StatsOverview, "Traffic overview"),
    ...problems(401, 403),
  },
  security: [{ session: [] }],
  summary: "Traffic overview",
  tags: ["Admin · Stats"],
});

const vitals = createRoute({
  method: "get",
  middleware: [requirePermission({ stats: ["read"] })] as const,
  path: "/admin/stats/vitals",
  request: { query: statsRangeQuerySchema },
  responses: {
    200: json(WebVitals, "p75 per Core Web Vital"),
    ...problems(401, 403, 502),
  },
  security: [{ session: [] }],
  summary: "Field Web Vitals",
  tags: ["Admin · Stats"],
});

export const statsRoutes = createRouter()
  .openapi(track, async (c) => {
    await service.track(c.req.valid("json"), {
      // The runtime always attaches incoming `cf` properties; the Request type is generic over them.
      country:
        (c.req.raw.cf as IncomingRequestCfProperties | undefined)?.country ??
        "",
      ip: c.req.header("cf-connecting-ip") ?? "",
      userAgent: c.req.header("user-agent") ?? "",
    });
    return c.body(null, 204);
  })
  .openapi(overview, async (c) =>
    c.json(await service.overview(c.req.valid("query").days), 200)
  )
  .openapi(vitals, async (c) =>
    c.json(await service.webVitals(c.req.valid("query").days), 200)
  );
