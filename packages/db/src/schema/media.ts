import { index, integer, primaryKey, text } from "drizzle-orm/sqlite-core";

import { id, locale, ref, defineTable, timestamps } from "../columns.ts";
import { user } from "./auth.ts";

/**
 * A stored binary in R2. The object key is content-addressed (`media/<sha256>.<ext>`),
 * so identical uploads deduplicate to one row and one object.
 */
export const media = defineTable(
  "media",
  {
    id: id(),
    key: text().notNull().unique(),
    sha256: text().notNull().unique(),
    mimeType: text().notNull(),
    size: integer().notNull(),
    width: integer(),
    height: integer(),
    /** Tiny inline WebP (data URI) shown while the image loads; needs no client-side decoder. */
    placeholder: text(),
    uploaderId: ref().references(() => user.id, { onDelete: "set null" }),
    ...timestamps(),
  },
  (table) => [index("media_uploader_idx").on(table.uploaderId)]
);

/** Localized accessibility text and caption for a media item. */
export const mediaTranslation = defineTable(
  "media_translation",
  {
    mediaId: ref()
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    locale: locale(),
    alt: text().notNull(),
    caption: text(),
  },
  (table) => [primaryKey({ columns: [table.mediaId, table.locale] })]
);
