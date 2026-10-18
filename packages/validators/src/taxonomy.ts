import { models } from "@orkide/db/models";
import { z } from "zod";

import {
  alternateSchema,
  idSchema,
  localeSchema,
  slugSchema,
  uniqueLocales,
} from "./common.ts";
import { TEXT_MAX } from "./limits.ts";

const categoryTranslationInputSchema = models.insert.categoryTranslation
  .pick({ description: true, name: true })
  .extend({
    locale: localeSchema,
    name: z.string().trim().min(1).max(TEXT_MAX.categoryName),
    slug: slugSchema,
  });

export const categoryInputSchema = models.insert.category
  .pick({ position: true })
  .extend({
    parentId: idSchema.nullish(),
    translations: z
      .array(categoryTranslationInputSchema)
      .min(1)
      .refine(uniqueLocales, "Duplicate locale."),
  });

const tagTranslationInputSchema = models.insert.tagTranslation
  .pick({ name: true })
  .extend({
    locale: localeSchema,
    name: z.string().trim().min(1).max(TEXT_MAX.tagName),
    slug: slugSchema,
  });

export const tagInputSchema = z.object({
  translations: z
    .array(tagTranslationInputSchema)
    .min(1)
    .refine(uniqueLocales, "Duplicate locale."),
});

/** Localized taxonomy term as served to readers. */
export const termSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: slugSchema,
});

/** A term in the public taxonomy listing, with its slug in every locale (for its page's `hreflang`). */
export const taxonomyTermSchema = termSchema.extend({
  alternates: z.array(alternateSchema),
});

/** Editable state of every term, as loaded by the admin taxonomy manager. */
export const taxonomyRecordSchema = z.object({
  categories: z.array(
    categoryInputSchema.extend({
      id: idSchema,
      parentId: idSchema.nullable(),
      position: z.number().int(),
    })
  ),
  tags: z.array(tagInputSchema.extend({ id: idSchema })),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;
export type Term = z.infer<typeof termSchema>;
export type TaxonomyTerm = z.infer<typeof taxonomyTermSchema>;
