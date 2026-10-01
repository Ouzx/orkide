import { hc } from "hono/client";

import type { AppType } from "./app.ts";

/**
 * Pre-instantiated RPC client type (Hono's `hcWithType` pattern). Emitting this as a declaration
 * lets consumers get end-to-end types without compiling the API's sources or its Worker types.
 */
const client = hc<AppType>("");
export type Client = typeof client;

/** Shared-cache tags. Readers' responses carry them; writes purge them (API and web Workers). */
export type CacheTag = "posts" | "projects" | "taxonomy";

/**
 * Response header listing the cache tags a write invalidated. Workers Cache is scoped per Worker,
 * so the web Worker (which forwards `/api/*`) reads it to purge its own rendered pages, then
 * strips it before the response reaches the browser.
 */
export const PURGE_TAGS_HEADER = "orkide-purge-tags";

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);
