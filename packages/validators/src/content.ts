import { models } from "@orkide/db/models";
import { z } from "zod";

import {
  idSchema,
  isoDateSchema,
  localeSchema,
  safeRichTextDocumentSchema,
  slugSchema,
  uniqueLocales,
} from "./common.ts";
import { mediaSchema } from "./media.ts";
import { termSchema } from "./taxonomy.ts";

/**
 * Editable fields of a translated document. Derived columns (`html`, `markdown`,
 * `readingTimeMinutes`) are computed on save and never accepted from clients.
 */
const documentTranslationInputSchema = models.insert.postTranslation
  .pick({ seoDescription: true, seoTitle: true })
  .extend({
    content: safeRichTextDocumentSchema,
    locale: localeSchema,
    seoDescription: z.string().trim().max(160).nullish(),
    seoTitle: z.string().trim().max(70).nullish(),
    slug: slugSchema,
    summary: z.string().trim().min(1).max(300),
    title: z.string().trim().min(1).max(140),
  });

const translationsSchema = z
  .array(documentTranslationInputSchema)
  .min(1)
  .refine(uniqueLocales, "Each locale can only be translated once.");

const scheduleRefinement = <
  T extends { status?: string; scheduledAt?: Date | null },
>(
  input: T
) =>
  input.status !== "scheduled" ||
  (input.scheduledAt !== null && input.scheduledAt !== undefined);

const SCHEDULE_ISSUE = {
  message: "Scheduled content needs a publication date.",
  path: ["scheduledAt"],
};

/** Timestamps an admin record carries on the wire. */
const recordTimestamps = {
  createdAt: isoDateSchema,
  id: idSchema,
  publishedAt: isoDateSchema.nullable(),
  scheduledAt: isoDateSchema.nullable(),
  updatedAt: isoDateSchema,
};

// Unrefined bases: zod forbids `.extend()` on refined objects, so inputs refine and records extend.
const postFieldsSchema = models.insert.post.pick({ status: true }).extend({
  categoryId: idSchema.nullish(),
  coverMediaId: idSchema.nullish(),
  scheduledAt: z.coerce.date().nullish(),
  tagIds: z.array(idSchema).max(20).default([]),
  translations: translationsSchema,
});

const projectFieldsSchema = models.insert.project
  .pick({ featured: true, position: true, status: true })
  .extend({
    completedAt: z.coerce.date().nullish(),
    coverMediaId: idSchema.nullish(),
    repositoryUrl: z.url({ protocol: /^https$/u }).nullish(),
    scheduledAt: z.coerce.date().nullish(),
    startedAt: z.coerce.date().nullish(),
    tagIds: z.array(idSchema).max(20).default([]),
    translations: translationsSchema,
    websiteUrl: z.url({ protocol: /^https$/u }).nullish(),
  });

export const postInputSchema = postFieldsSchema.refine(
  scheduleRefinement,
  SCHEDULE_ISSUE
);
export const projectInputSchema = projectFieldsSchema.refine(
  scheduleRefinement,
  SCHEDULE_ISSUE
);

/** Full editable state of a post, as loaded by the admin editor. */
export const postRecordSchema = postFieldsSchema.extend({
  ...recordTimestamps,
  categoryId: idSchema.nullable(),
  coverMediaId: idSchema.nullable(),
  status: models.select.post.shape.status,
});

/** Full editable state of a project, as loaded by the admin editor. */
export const projectRecordSchema = projectFieldsSchema.extend({
  ...recordTimestamps,
  completedAt: isoDateSchema.nullable(),
  coverMediaId: idSchema.nullable(),
  featured: z.boolean(),
  position: z.number().int(),
  repositoryUrl: z.string().nullable(),
  startedAt: isoDateSchema.nullable(),
  status: models.select.project.shape.status,
  websiteUrl: z.string().nullable(),
});

/** Link to the same document in another locale, for `hreflang` and the language switcher. */
const alternateSchema = z.object({ locale: localeSchema, slug: slugSchema });

/** Reader-facing card shared by post and project listings. */
export const documentSummarySchema = z.object({
  alternates: z.array(alternateSchema),
  cover: mediaSchema.nullable(),
  id: idSchema,
  locale: localeSchema,
  publishedAt: isoDateSchema.nullable(),
  readingTimeMinutes: z.number().int().positive(),
  slug: slugSchema,
  summary: z.string(),
  tags: z.array(termSchema),
  title: z.string(),
});

export const documentDetailSchema = documentSummarySchema.extend({
  html: z.string(),
  seoDescription: z.string().nullable(),
  seoTitle: z.string().nullable(),
  updatedAt: isoDateSchema,
});

export const postSummarySchema = documentSummarySchema.extend({
  category: termSchema.nullable(),
});
export const postDetailSchema = documentDetailSchema.extend({
  attachments: z.array(mediaSchema),
  author: z
    .object({ image: z.string().nullable(), name: z.string() })
    .nullable(),
  category: termSchema.nullable(),
});

export const projectSummarySchema = documentSummarySchema.extend({
  featured: z.boolean(),
  repositoryUrl: z.string().nullable(),
  websiteUrl: z.string().nullable(),
});
export const projectDetailSchema = documentDetailSchema.extend({
  completedAt: isoDateSchema.nullable(),
  featured: z.boolean(),
  repositoryUrl: z.string().nullable(),
  startedAt: isoDateSchema.nullable(),
  websiteUrl: z.string().nullable(),
});

/** Public listing filters. */
export const postListQuerySchema = z.object({
  category: slugSchema.optional(),
  tag: slugSchema.optional(),
});

export type PostInput = z.infer<typeof postInputSchema>;
export type PostRecord = z.infer<typeof postRecordSchema>;
export type ProjectRecord = z.infer<typeof projectRecordSchema>;
export type DocumentTranslationInput = z.infer<
  typeof documentTranslationInputSchema
>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type PostSummary = z.infer<typeof postSummarySchema>;
export type PostDetail = z.infer<typeof postDetailSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
