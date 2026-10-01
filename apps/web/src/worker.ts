import { cf } from "@astrojs/cloudflare/hono";
import { PURGE_TAGS_HEADER } from "@orkide/api-client";
import { astro } from "astro/hono";
import { cache } from "cloudflare:workers";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";

/**
 * Web Worker entry. Hono sits in front of Astro so the Worker owns every request:
 *
 * 1. `/api/*` is forwarded to the API Worker through the Service Binding (same origin for the
 *    browser, no CORS, no extra network hop). When an admin write reports the cache tags it
 *    touched, the rendered pages carrying those tags are purged from this Worker's cache —
 *    Workers Cache is per Worker, so the API cannot purge them itself.
 * 2. Everything else goes through the Astro pipeline (static assets, middleware, pages).
 */
const app = new Hono<{ Bindings: Env }>();

app.all("/api/*", async (c) => {
  const response = await c.env.API.fetch(c.req.raw);
  const tags = response.headers.get(PURGE_TAGS_HEADER);
  if (!tags) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.delete(PURGE_TAGS_HEADER);
  if (typeof cache?.purge === "function") {
    c.executionCtx.waitUntil(cache.purge({ tags: tags.split(",") }));
  }
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
});

// Pages only: API responses carry their own headers (and are immutable once fetched).
app.use(
  secureHeaders({
    // No `contentSecurityPolicy` here: that header is Astro's (`security.csp`, per-page hashes).
    crossOriginEmbedderPolicy: false,
    permissionsPolicy: {
      camera: [],
      geolocation: [],
      microphone: [],
      payment: [],
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    xFrameOptions: "DENY",
  })
);
// `trailingSlash: "never"`: `/en/blog/` permanently redirects to `/en/blog`.
app.use(trimTrailingSlash({ alwaysRedirect: true }));
app.use(cf());
app.use(astro());

export default app;
