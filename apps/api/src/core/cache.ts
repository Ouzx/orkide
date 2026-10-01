import { env } from "cloudflare:workers";

/**
 * Read-through cache for public API responses, backed by KV.
 *
 * The Cache API is a no-op on `*.workers.dev`, so KV is the edge cache here. Entries are keyed by a
 * per-namespace version: publishing content bumps the version, which invalidates every entry of
 * that namespace instantly without enumerating keys; stale versions simply expire.
 */
export type CacheNamespace = "posts" | "projects" | "taxonomy";

const VERSION_KEY = (namespace: CacheNamespace) => `cache-version:${namespace}`;
/** KV's minimum TTL is 60 seconds. */
const DEFAULT_TTL_SECONDS = 300;

const currentVersion = async (namespace: CacheNamespace): Promise<string> =>
  (await env.CACHE.get(VERSION_KEY(namespace), { cacheTtl: 60 })) ?? "0";

/** Invalidates every cached entry in the namespace. Call after any write that changes public data. */
export const invalidate = async (namespace: CacheNamespace): Promise<void> => {
  await env.CACHE.put(VERSION_KEY(namespace), Date.now().toString(36));
};

/** Returns the cached value for `key`, computing and storing it on a miss. */
export const cached = async <T>(
  namespace: CacheNamespace,
  key: string,
  load: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<T> => {
  const entryKey = `cache:${namespace}:${await currentVersion(namespace)}:${key}`;
  const hit = await env.CACHE.get<T>(entryKey, { cacheTtl: 60, type: "json" });
  if (hit !== null) {
    return hit;
  }
  const value = await load();
  await env.CACHE.put(entryKey, JSON.stringify(value), {
    expirationTtl: ttlSeconds,
  });
  return value;
};
