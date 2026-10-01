import type { RenderedEmail } from "@orkide/email";
import { env } from "cloudflare:workers";
import { Resend } from "resend";

import { PermanentJobError } from "../core/jobs.ts";

const resend = new Resend(env.RESEND_API_KEY);

/** Resend error names that will never succeed on retry. */
const PERMANENT_ERRORS = new Set([
  "invalid_from_address",
  "invalid_parameter",
  "missing_required_field",
  "validation_error",
]);

export interface Delivery {
  readonly to: string;
  readonly replyTo?: string;
  /**
   * Stable key for this logical email. Resend deduplicates on it, so queue retries never send twice.
   */
  readonly idempotencyKey: string;
}

/** Sends a rendered email through Resend; permanent rejections surface as {@link PermanentJobError}. */
export const send = async (
  email: RenderedEmail,
  { to, replyTo, idempotencyKey }: Delivery
): Promise<string> => {
  const { data, error } = await resend.emails.send(
    {
      from: env.EMAIL_FROM,
      html: email.html,
      replyTo,
      subject: email.subject,
      text: email.text,
      to,
    },
    { idempotencyKey }
  );
  if (error) {
    const message = `Resend rejected the email: ${error.message}`;
    throw PERMANENT_ERRORS.has(error.name)
      ? new PermanentJobError(message)
      : new Error(message);
  }
  return data.id;
};
