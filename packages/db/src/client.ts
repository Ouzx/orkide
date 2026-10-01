import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import type { AnyD1Database } from "drizzle-orm/d1";

import { relations } from "./relations.ts";

declare global {
  // oxlint-disable-next-line typescript/no-namespace -- `Cloudflare.Env` is a global namespace by design.
  namespace Cloudflare {
    interface Env {
      /** Primary D1 database. Declared here so every Worker that imports `@orkide/db` must bind it. */
      DB: D1Database;
    }
  }
}

/** Creates a Drizzle client over a D1 database or a D1 read-replication session. */
export const createDb = (database: AnyD1Database) =>
  drizzle(database, { relations });

export type Database = ReturnType<typeof createDb>;

/**
 * Process-wide client bound to the primary database. Workers expose bindings at module scope
 * through `cloudflare:workers`, so this can be imported anywhere without threading `env` around.
 *
 * For latency-sensitive reads, open a read-replication session instead:
 * `createDb(env.DB.withSession(bookmark))`.
 */
export const db: Database = createDb(env.DB);

export { generateId } from "./columns.ts";
