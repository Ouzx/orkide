import { models } from "@orkide/db/models";
import { z } from "zod";

import { localeSchema } from "./common.ts";

/** Public contact form submission, including the Turnstile proof-of-humanity token. */
export const contactInputSchema = models.insert.contactMessage
  .pick({ body: true, email: true, name: true, subject: true })
  .extend({
    body: z.string().trim().min(10).max(5000),
    email: z.email().max(254),
    locale: localeSchema,
    name: z.string().trim().min(1).max(120),
    subject: z.string().trim().max(160).nullish(),
    turnstileToken: z.string().min(1).max(2048),
  });

export const contactMessageStatusSchema =
  models.select.contactMessage.shape.status;

export const contactMessageUpdateSchema = z.object({
  status: contactMessageStatusSchema,
});

export type ContactInput = z.infer<typeof contactInputSchema>;
