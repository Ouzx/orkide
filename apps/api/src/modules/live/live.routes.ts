import { createRoute, z } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";

import { createRouter } from "../../core/factory.ts";
import { requireFlag } from "../../core/flags.ts";
import { requirePermission } from "../../core/middleware/auth.ts";

/** One global presence room. */
const ROOM = "site";
const FEED_INTERVAL_MS = 5000;

const presenceStub = (env: Env) =>
  env.LIVE_VISITORS.get(env.LIVE_VISITORS.idFromName(ROOM));

const connect = createRoute({
  description:
    'Upgrades to a WebSocket that receives `{ type: "presence", visitors }` messages.',
  method: "get",
  middleware: [requireFlag("live-visitors")] as const,
  path: "/live",
  responses: {
    101: { description: "Switching protocols" },
    426: { description: "Upgrade required" },
  },
  summary: "Join the live presence room",
  tags: ["Live"],
});

const feed = createRoute({
  description:
    "Server-sent events with the visitor count, for the admin dashboard.",
  method: "get",
  middleware: [requirePermission({ stats: ["read"] })] as const,
  path: "/live/feed",
  responses: {
    200: {
      content: { "text/event-stream": { schema: z.string() } },
      description: "`presence` events every few seconds",
    },
  },
  security: [{ session: [] }],
  summary: "Live visitor feed",
  tags: ["Live"],
});

export const liveRoutes = createRouter()
  .openapi(connect, async (c) => {
    const response = await presenceStub(c.env).fetch(c.req.raw);
    // Responses from a Durable Object stub have immutable headers, which the security and cache
    // middleware must still be able to set; re-wrapping copies them (and the WebSocket, if any).
    return new Response(response.body, response);
  })
  .openapi(feed, (c) =>
    streamSSE(c, async (stream) => {
      const stub = presenceStub(c.env);
      let id = 0;
      // Sequential by design: one sample per tick for as long as the client stays connected.
      // oxlint-disable no-await-in-loop
      while (!stream.aborted) {
        const visitors = await stub.count();
        await stream.writeSSE({
          data: JSON.stringify({ visitors }),
          event: "presence",
          id: String(id),
        });
        id += 1;
        await stream.sleep(FEED_INTERVAL_MS);
      }
      // oxlint-enable no-await-in-loop
    })
  );
