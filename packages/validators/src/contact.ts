import { models } from "@orkide/db/models";
import { z } from "zod";

import { isoDateSchema, localeSchema } from "./common.ts";
import { CONTACT_BODY_MIN, TEXT_MAX } from "./limits.ts";

/** Public contact form submission, including the Turnstile proof-of-humanity token. */
export const contactInputSchema = models.insert.contactMessage
  .pick({ body: true, email: true, name: true, subject: true })
  .extend({
    body: z.string().trim().min(CONTACT_BODY_MIN).max(TEXT_MAX.contactBody),
    email: z.email().max(TEXT_MAX.email),
    locale: localeSchema,
    name: z.string().trim().min(1).max(TEXT_MAX.contactName),
    subject: z.string().trim().max(TEXT_MAX.contactSubject).nullish(),
    turnstileToken: z.string().min(1).max(2048),
  });

export const contactMessageStatusSchema =
  models.select.contactMessage.shape.status;

/** A stored message as the inbox reads it; the IP hash stays on the server. */
export const contactMessageSchema = models.select.contactMessage
  .omit({ ipHash: true })
  .extend({
    createdAt: isoDateSchema,
    email: z.email(),
    updatedAt: isoDateSchema,
  });

export const contactMessageUpdateSchema = z.object({
  status: contactMessageStatusSchema,
});

export type ContactInput = z.infer<typeof contactInputSchema>;
