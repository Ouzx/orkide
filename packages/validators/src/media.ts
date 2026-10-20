import { models } from "@orkide/db/models";
import { z } from "zod";

import { idSchema, localeSchema } from "./common.ts";
import { TEXT_MAX } from "./limits.ts";

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
  alt: z.string().trim().min(1).max(TEXT_MAX.alt),
  caption: z.string().trim().max(TEXT_MAX.caption).nullish(),
  locale: localeSchema,
});

export const mediaUpdateSchema = z.object({
  translations: z.array(mediaTranslationInputSchema).min(1),
});

export type Media = z.infer<typeof mediaSchema>;

/** Whether a media item plays (a video) rather than shows (an image). A cover may be either. */
export const isVideo = (media: Pick<Media, "mimeType">): boolean =>
  media.mimeType.startsWith("video/");
export type MediaUpdate = z.infer<typeof mediaUpdateSchema>;
