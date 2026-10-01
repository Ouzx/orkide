import { cache } from "cloudflare:workers";

import { factory } from "./factory.ts";

/**
 * HTTP caching for the API, built on Workers Cache (a tiered, request-collapsing cache in front of
 * the Worker, keyed by path + query and shared across `workers.dev`, routes and service bindings).
 *
 * - Every response is `private, no-store` unless a route explicitly opts in. Cookies are not part
 *   of the cache key, so opting in is reserved for responses that are identical for every visitor.
 * - Shared responses carry `Cache-Tag`s; writes purge the affected tags globally.
 */
export type CacheTag = "posts" | "projects" | "taxonomy";

/** Browser: 1 min. Shared cache: 1 day, refreshed in the background, purged on every write. */
const SHARED =
  "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800";
const PRIVATE = "private, no-store";

/** Fail-safe default: anything a handler did not mark cacheable is never stored. */
export const noStoreByDefault = factory.createMiddleware(async (c, next) => {
  await next();
  if (!c.res.headers.has("cache-control")) {
    c.header("cache-control", PRIVATE);
  }
});

/**
 * Marks a reader-facing response as shared-cacheable under `tags`.
 * Only applied when the locale is explicit in the URL (and therefore in the cache key); a
 * negotiated locale makes the response visitor-specific, so it stays private.
 */
export const shareable = (...tags: CacheTag[]) =>
  factory.createMiddleware(async (c, next) => {
    await next();
    if (!c.res.ok) {
      return;
    }
    if (c.req.query("locale") === undefined) {
      c.header("cache-control", PRIVATE);
      return;
    }
    c.header("cache-control", SHARED);
    c.header("cache-tag", tags.join(","));
  });

/**
 * Invalidates every shared response carrying one of `tags`, in every data center.
 * The local runtime (Miniflare) does not emulate Workers Cache, so there is nothing to purge there.
 */
export const purge = async (...tags: CacheTag[]): Promise<void> => {
  if (typeof cache?.purge !== "function") {
    return;
  }
  const result = await cache.purge({ tags });
  if (!result.success) {
    throw new Error(`Cache purge failed for ${tags.join(", ")}`, {
      cause: result.errors,
    });
  }
};
