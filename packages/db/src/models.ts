import { is, Table } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/zod";
import type { BuildSchema } from "drizzle-orm/zod";

import * as schema from "./schema/index.ts";

/**
 * Zod schemas generated from every table, grouped by operation (Elysia's "table singleton"):
 *
 * ```ts
 * models.insert.post            // full insert schema
 * models.select.user.shape.email // reuse a single field
 * models.update.post.pick({ status: true })
 * ```
 *
 * Refine or compose these in `@orkide/validators`; never redeclare a table's shape by hand.
 * Platform-agnostic: safe to import from Workers, browsers and React Native.
 */
type Tables = {
  [
    K in keyof typeof schema as (typeof schema)[K] extends Table ? K : never
  ]: (typeof schema)[K];
};

type Models<TMode extends "insert" | "select" | "update"> = {
  readonly [K in keyof Tables]: BuildSchema<
    TMode,
    Tables[K]["_"]["columns"],
    undefined,
    undefined
  >;
};

const tables = Object.fromEntries(
  Object.entries(schema).filter(([, value]) => is(value, Table))
) as Tables;

const build = <TMode extends "insert" | "select" | "update">(
  factory: (table: Table) => unknown
): Models<TMode> =>
  Object.fromEntries(
    Object.entries(tables).map(([name, table]) => [name, factory(table)])
  ) as Models<TMode>;

export const models = {
  insert: build<"insert">(createInsertSchema),
  select: build<"select">(createSelectSchema),
  update: build<"update">(createUpdateSchema),
} as const;
