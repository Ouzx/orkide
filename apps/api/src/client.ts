import { hc } from "hono/client";

import type { AppType } from "./app.ts";

/** RFC 9457 problem body of every API error (`ApiError`). */
export type { Problem } from "./core/problem.ts";

/**
 * Pre-instantiated RPC client type (Hono's `hcWithType` pattern). Emitting this as a declaration
 * lets consumers get end-to-end types without compiling the API's sources or its Worker types.
 */
const client = hc<AppType>("");
export type Client = typeof client;

/** Shared-cache tags. Readers' responses carry them; writes purge them (API and web Workers). */
export type CacheTag = "posts" | "projects" | "site" | "taxonomy";

/**
 * Response header listing what a write invalidated: cache tags, and path prefixes (starting with
 * `/`) for responses that carry no tag. Workers Cache is scoped per Worker, so the web Worker
 * (which forwards `/api/*`) reads it to purge its own cache, then strips it before the response
 * reaches the browser.
 */
export const PURGE_TAGS_HEADER = "orkide-purge-tags";

/** `cache.purge()` options for purge targets: entries starting with `/` are path prefixes. */
export const purgeOptions = (targets: readonly string[]) => {
  const pathPrefixes = targets.filter((target) => target.startsWith("/"));
  const tags = targets.filter((target) => !target.startsWith("/"));
  return {
    ...(pathPrefixes.length > 0 ? { pathPrefixes } : {}),
    ...(tags.length > 0 ? { tags } : {}),
  };
};

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);
