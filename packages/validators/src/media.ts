import { models } from "@orkide/db/models";
import { z } from "zod";

import { idSchema, localeSchema } from "./common.ts";

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
