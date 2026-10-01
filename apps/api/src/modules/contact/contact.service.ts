import { emails } from "@orkide/email";
import { baseLocale } from "@orkide/i18n";
import type { ContactInput } from "@orkide/validators/contact";
import { env } from "cloudflare:workers";

import { ApiError } from "../../core/errors.ts";
import { enqueue, PermanentJobError } from "../../core/jobs.ts";
import type { JobOf } from "../../core/jobs.ts";
import { send } from "../../shared/mailer.ts";
import { verifyTurnstile } from "../../shared/turnstile.ts";
import * as repository from "./contact.repository.ts";

/** One-way, secret-salted hash: lets abuse be correlated without ever storing an IP address. */
const hashIp = async (ip: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${env.BETTER_AUTH_SECRET}:${ip}`)
  );
  return new Uint8Array(digest).toHex();
};

export interface SubmissionContext {
  readonly ip: string | undefined;
  readonly userAgent: string | undefined;
}

/**
 * Accepts a contact submission: proves the sender is human, stores the message, then hands the
 * emails to the queue so the response never waits on (or fails because of) the email provider.
 */
export const submit = async (
  { turnstileToken, ...input }: ContactInput,
  context: SubmissionContext
) => {
  if (!(await verifyTurnstile(turnstileToken, context.ip))) {
    throw new ApiError("forbidden", { detail: "Human verification failed." });
  }
  const messageId = await repository.create({
    ...input,
    ipHash: context.ip ? await hashIp(context.ip) : null,
    subject: input.subject ?? null,
    userAgent: context.userAgent?.slice(0, 512) ?? null,
  });
  await enqueue(
    { messageId, type: "contact.notify-owner" },
    { messageId, type: "contact.acknowledge-sender" }
  );
  return messageId;
};

const loadMessage = async (messageId: string) => {
  const message = await repository.findById(messageId);
  if (!message) {
    throw new PermanentJobError(
      `Contact message ${messageId} no longer exists.`
    );
  }
  return message;
};

export const notifyOwner = async ({
  messageId,
}: JobOf<"contact.notify-owner">) => {
  const message = await loadMessage(messageId);
  const email = await emails.contactNotification({
    body: message.body,
    email: message.email,
    locale: baseLocale,
    name: message.name,
    senderLocale: message.locale,
    siteUrl: env.BETTER_AUTH_URL,
    subject: message.subject,
  });
  await send(email, {
    idempotencyKey: `contact-notify/${messageId}`,
    replyTo: message.email,
    to: env.CONTACT_INBOX_EMAIL,
  });
};

export const acknowledgeSender = async ({
  messageId,
}: JobOf<"contact.acknowledge-sender">) => {
  const message = await loadMessage(messageId);
  if (message.status === "spam") {
    return;
  }
  const email = await emails.contactAcknowledgement({
    body: message.body,
    locale: message.locale,
    name: message.name,
    siteUrl: env.BETTER_AUTH_URL,
  });
  await send(email, {
    idempotencyKey: `contact-ack/${messageId}`,
    to: message.email,
  });
};

export const list = async (status?: Parameters<typeof repository.list>[0]) => {
  const rows = await repository.list(status);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
};

export const updateStatus = async (
  id: string,
  status: Parameters<typeof repository.updateStatus>[1]
) => {
  if (!(await repository.updateStatus(id, status))) {
    throw new ApiError("not_found");
  }
};

export const remove = async (id: string) => {
  if (!(await repository.remove(id))) {
    throw new ApiError("not_found");
  }
};
