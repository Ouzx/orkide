import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeEach } from "vitest";

// Storage is isolated per test file; migrate once, then give every test empty tables and cache.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

const { results: tables } = await env.DB.prepare(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'd1_%' AND name NOT LIKE '_cf_%'"
).all<{ name: string }>();

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare("PRAGMA defer_foreign_keys = ON"),
    ...tables.map(({ name }) => env.DB.prepare(`DELETE FROM "${name}"`)),
  ]);
  const { keys } = await env.CACHE.list();
  await Promise.all(keys.map(({ name }) => env.CACHE.delete(name)));
});
