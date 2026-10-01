import { locales } from "@orkide/i18n";
import { sql } from "drizzle-orm";
import { integer, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";

/** Table builder for hand-written schemas: camelCase keys map to snake_case columns. */
export const defineTable = sqliteTableCreator((name) => name, "snake_case");

/** Generates a time-ordered UUIDv7 — the only ID format used across the schema. */
export const generateId = (): string => uuidv7();

/** UUIDv7 text primary key. */
export const id = () => text().primaryKey().$defaultFn(generateId);

/** Foreign key column holding a UUIDv7. */
export const ref = () => text();

const nowMs = sql`(cast(unixepoch('subsec') * 1000 as integer))`;

/** Millisecond-precision timestamp, exposed as `Date`. */
export const timestamp = () => integer({ mode: "timestamp_ms" });

/** `createdAt` / `updatedAt` pair; `updatedAt` refreshes on every update issued through Drizzle. */
export const timestamps = () => ({
  createdAt: timestamp().notNull().default(nowMs),
  updatedAt: timestamp()
    .notNull()
    .default(nowMs)
    .$onUpdateFn(() => new Date()),
});

/** Locale of a translated row, constrained to the locales configured in `@orkide/i18n`. */
export const locale = () => text({ enum: locales }).notNull();

/** URL slug: lowercase kebab-case, unique per locale (enforced by table indexes). */
export const slug = () => text().notNull();
