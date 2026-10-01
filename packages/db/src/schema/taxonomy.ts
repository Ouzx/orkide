import {
  index,
  integer,
  primaryKey,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

import { id, locale, ref, slug, defineTable, timestamps } from "../columns.ts";

/** Hierarchical category; a post belongs to at most one. */
export const category = defineTable(
  "category",
  {
    id: id(),
    parentId: ref().references((): AnySQLiteColumn => category.id, {
      onDelete: "set null",
    }),
    position: integer().notNull().default(0),
    ...timestamps(),
  },
  (table) => [index("category_parent_idx").on(table.parentId)]
);

export const categoryTranslation = defineTable(
  "category_translation",
  {
    categoryId: ref()
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    locale: locale(),
    slug: slug(),
    name: text().notNull(),
    description: text(),
  },
  (table) => [
    primaryKey({ columns: [table.categoryId, table.locale] }),
    uniqueIndex("category_translation_slug_idx").on(table.locale, table.slug),
  ]
);

/** Flat label shared by posts and projects (topics, technologies). */
export const tag = defineTable("tag", {
  id: id(),
  ...timestamps(),
});

export const tagTranslation = defineTable(
  "tag_translation",
  {
    tagId: ref()
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    locale: locale(),
    slug: slug(),
    name: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tagId, table.locale] }),
    uniqueIndex("tag_translation_slug_idx").on(table.locale, table.slug),
  ]
);
