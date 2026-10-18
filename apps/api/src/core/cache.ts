import { cache } from "cloudflare:workers";
import { tryGetContext } from "hono/context-storage";

import { PURGE_TAGS_HEADER, purgeOptions } from "../client.ts";
import type { CacheTag } from "../client.ts";
import { factory } from "./factory.ts";

/**
 * HTTP caching for the API, built on Workers Cache (a tiered, request-collapsing cache in front of
 * the Worker, keyed by path + query and shared across `workers.dev`, routes and service bindings).
 *
 * - Every response is `private, no-store` unless a route explicitly opts in. Cookies are not part
 *   of the cache key, so opting in is reserved for responses that are identical for every visitor.
 * - Shared responses carry `Cache-Tag`s; writes purge the affected tags globally.
 */
export type { CacheTag } from "../client.ts";

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

/** A cache tag, or the path prefix of responses that carry no tag (a media file). */
export type PurgeTarget = CacheTag | `/${string}`;

/**
 * Invalidates every shared response carrying one of the tags or under one of the paths, in every
 * data center, and reports them on the current response so the web Worker purges its copies too.
 * The local runtime (Miniflare) does not emulate Workers Cache, so there is nothing to purge there.
 */
export const purge = async (...targets: PurgeTarget[]): Promise<void> => {
  tryGetContext()?.header(PURGE_TAGS_HEADER, targets.join(","), {
    append: true,
  });
  if (typeof cache?.purge !== "function") {
    return;
  }
  const result = await cache.purge(purgeOptions(targets));
  if (!result.success) {
    throw new Error(`Cache purge failed for ${targets.join(", ")}`, {
      cause: result.errors,
    });
  }
};
