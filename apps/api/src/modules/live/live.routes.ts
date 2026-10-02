import { createRoute, z } from "@hono/zod-openapi";
import { env } from "cloudflare:workers";
import { streamSSE } from "hono/streaming";

import { ApiError } from "../../core/errors.ts";
import { createRouter } from "../../core/factory.ts";
import { requireFlag } from "../../core/flags.ts";
import { requirePermission } from "../../core/middleware/auth.ts";
import { problems } from "../../core/responses.ts";

/** One global presence room. */
const ROOM = "site";

/**
 * The only page origin allowed to join. Browsers always send `Origin` on a WebSocket handshake and
 * the CSRF middleware skips GET requests, so this is what keeps other sites (and bare scripts)
 * from opening sockets that inflate the count.
 */
const SITE_ORIGIN = new URL(env.BETTER_AUTH_URL).origin;
const FEED_INTERVAL_MS = 5000;

const presenceStub = (bindings: Env) =>
  bindings.LIVE_VISITORS.get(bindings.LIVE_VISITORS.idFromName(ROOM));

const connect = createRoute({
  description:
    "Upgrades to a WebSocket that counts the visitor as present while it stays open. The server sends no messages. Only the site's own pages may join, and each visitor may hold a limited number of sockets.",
  method: "get",
  middleware: [requireFlag("live-visitors")] as const,
  path: "/live",
  responses: {
    101: { description: "Switching protocols" },
    ...problems(403),
    426: { description: "Upgrade required" },
    429: { description: "Too many open connections from this visitor" },
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
    if (c.req.header("origin") !== SITE_ORIGIN) {
      throw new ApiError("forbidden");
    }
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
