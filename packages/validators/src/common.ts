import { isSafeHref } from "@orkide/content/extensions";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@orkide/content/slug";
import type { RichTextNode } from "@orkide/db/rich-text";
import { richTextDocumentSchema } from "@orkide/db/rich-text";
import { locales } from "@orkide/i18n";
import { z } from "zod";

export const localeSchema = z.enum(locales);

export const idSchema = z.uuid({ version: "v7" });

export const slugSchema = z
  .string()
  .min(1)
  .max(SLUG_MAX_LENGTH)
  .regex(SLUG_PATTERN, "Use lowercase letters, digits and single dashes.");

/** ISO-8601 timestamp on the wire; `Date` in the database. */
export const isoDateSchema = z.iso.datetime({ offset: true });

const unsafeLinks = (nodes: readonly RichTextNode[] | undefined): boolean =>
  (nodes ?? []).some(
    (node) =>
      (node.marks ?? []).some(
        (mark) => mark.type === "link" && !isSafeHref(mark.attrs?.href)
      ) || unsafeLinks(node.content)
  );

/** A Tiptap document whose links only use allowed protocols (no `javascript:`/`data:` URLs). */
export const safeRichTextDocumentSchema = richTextDocumentSchema.refine(
  (document) => !unsafeLinks(document.content),
  {
    message: "Links must use http, https, mailto or a relative URL.",
    path: ["content"],
  }
);

/** Keyset pagination: opaque cursor + page size. */
export const pageQuerySchema = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const pageSchema = <TItem extends z.ZodType>(item: TItem) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

/** Ensures each locale appears at most once in a list of translations. */
export const uniqueLocales = <T extends { locale: string }>(
  translations: readonly T[]
) =>
  new Set(translations.map((translation) => translation.locale)).size ===
  translations.length;
