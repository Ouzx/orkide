import { models } from "@orkide/db/models";
import { z } from "zod";

import { idSchema, localeSchema } from "./common.ts";

/** MIME types accepted by the upload pipeline, verified against the file's magic bytes. */
export const ALLOWED_MEDIA_TYPES = {
  "application/pdf": "pdf",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
} as const;

export type AllowedMediaType = keyof typeof ALLOWED_MEDIA_TYPES;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** A media item as served to clients, with alt text resolved for the requested locale. */
export const mediaSchema = models.select.media
  .pick({
    height: true,
    mimeType: true,
    placeholder: true,
    size: true,
    width: true,
  })
  .extend({
    alt: z.string(),
    caption: z.string().nullable(),
    id: idSchema,
    url: z.string(),
  });

export const mediaTranslationInputSchema = z.object({
  alt: z.string().trim().min(1).max(300),
  caption: z.string().trim().max(500).nullish(),
  locale: localeSchema,
});

export const mediaUpdateSchema = z.object({
  translations: z.array(mediaTranslationInputSchema).min(1),
});

export type Media = z.infer<typeof mediaSchema>;
export type MediaUpdate = z.infer<typeof mediaUpdateSchema>;
