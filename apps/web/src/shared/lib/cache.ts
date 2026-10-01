import type { CacheTag } from "@orkide/api-client";
import type { AstroGlobal } from "astro";

/**
 * Edge cache policy for rendered pages (Astro route caching → Workers Cache).
 *
 * Fresh for 5 minutes — the cadence of the scheduled-publishing cron, which cannot purge this
 * Worker's cache — then served stale while revalidating for a day. Admin writes purge the
 * matching tags immediately (see `src/worker.ts`), and every deployment starts a fresh cache.
 */
const PAGE_CACHE = { maxAge: 300, swr: 86_400 } as const;

/** Marks the current page as identical for every visitor and shared-cacheable under `tags`. */
export const cachePage = (
  astro: Pick<AstroGlobal, "cache">,
  ...tags: CacheTag[]
): void => {
  astro.cache.set({ ...PAGE_CACHE, tags });
};
