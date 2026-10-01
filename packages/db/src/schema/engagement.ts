import { index, integer, primaryKey, text } from "drizzle-orm/sqlite-core";

import { id, locale, defineTable, timestamps } from "../columns.ts";

export const contactMessageStatuses = [
  "new",
  "read",
  "archived",
  "spam",
] as const;

/** A message submitted through the contact form. The sender's IP is stored only as a salted hash. */
export const contactMessage = defineTable(
  "contact_message",
  {
    id: id(),
    name: text().notNull(),
    email: text().notNull(),
    subject: text(),
    body: text().notNull(),
    locale: locale(),
    status: text({ enum: contactMessageStatuses }).notNull().default("new"),
    ipHash: text(),
    userAgent: text(),
    ...timestamps(),
  },
  (table) => [
    index("contact_message_status_idx").on(table.status, table.createdAt),
  ]
);

/**
 * Daily page-view rollup. Raw events live in Analytics Engine; a cron trigger aggregates them
 * here so the dashboard reads a handful of rows instead of scanning events.
 */
export const dailyStat = defineTable(
  "daily_stat",
  {
    /** Calendar day in UTC, `YYYY-MM-DD`. */
    day: text().notNull(),
    path: text().notNull(),
    views: integer().notNull().default(0),
    visitors: integer().notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.day, table.path] })]
);
