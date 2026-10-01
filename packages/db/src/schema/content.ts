import {
  index,
  integer,
  primaryKey,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import {
  id,
  locale,
  ref,
  slug,
  defineTable,
  timestamp,
  timestamps,
} from "../columns.ts";
import type { RichTextDocument } from "../rich-text.ts";
import { user } from "./auth.ts";
import { media } from "./media.ts";
import { category, tag } from "./taxonomy.ts";

/** Lifecycle of publishable content. `scheduled` rows are published by a cron trigger. */
export const publicationStatuses = [
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;

const publication = () => ({
  status: text({ enum: publicationStatuses }).notNull().default("draft"),
  publishedAt: timestamp(),
  scheduledAt: timestamp(),
});

/**
 * Per-locale document body. `content` (Tiptap JSON) is the source of truth;
 * `html` and `markdown` are derived on save for rendering and for AI-readable alternates.
 */
const document = () => ({
  locale: locale(),
  slug: slug(),
  title: text().notNull(),
  summary: text().notNull(),
  content: text({ mode: "json" }).$type<RichTextDocument>().notNull(),
  html: text().notNull(),
  markdown: text().notNull(),
  readingTimeMinutes: integer().notNull().default(1),
  seoTitle: text(),
  seoDescription: text(),
  ...timestamps(),
});

export const post = defineTable(
  "post",
  {
    id: id(),
    authorId: ref().references(() => user.id, { onDelete: "set null" }),
    categoryId: ref().references(() => category.id, { onDelete: "set null" }),
    coverMediaId: ref().references(() => media.id, { onDelete: "set null" }),
    ...publication(),
    ...timestamps(),
  },
  (table) => [
    index("post_status_published_idx").on(table.status, table.publishedAt),
    index("post_category_idx").on(table.categoryId),
  ]
);

export const postTranslation = defineTable(
  "post_translation",
  {
    postId: ref()
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    ...document(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.locale] }),
    uniqueIndex("post_translation_slug_idx").on(table.locale, table.slug),
  ]
);

export const postTag = defineTable(
  "post_tag",
  {
    postId: ref()
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    tagId: ref()
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("post_tag_tag_idx").on(table.tagId),
  ]
);

/** Files attached to a post (downloads, galleries), in display order. */
export const postAttachment = defineTable(
  "post_attachment",
  {
    postId: ref()
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    mediaId: ref()
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    position: integer().notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.postId, table.mediaId] })]
);

export const project = defineTable(
  "project",
  {
    id: id(),
    coverMediaId: ref().references(() => media.id, { onDelete: "set null" }),
    websiteUrl: text(),
    repositoryUrl: text(),
    featured: integer({ mode: "boolean" }).notNull().default(false),
    position: integer().notNull().default(0),
    startedAt: timestamp(),
    completedAt: timestamp(),
    ...publication(),
    ...timestamps(),
  },
  (table) => [
    index("project_status_position_idx").on(table.status, table.position),
  ]
);

export const projectTranslation = defineTable(
  "project_translation",
  {
    projectId: ref()
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    ...document(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.locale] }),
    uniqueIndex("project_translation_slug_idx").on(table.locale, table.slug),
  ]
);

export const projectTag = defineTable(
  "project_tag",
  {
    projectId: ref()
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    tagId: ref()
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.tagId] }),
    index("project_tag_tag_idx").on(table.tagId),
  ]
);
