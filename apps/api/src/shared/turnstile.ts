import { z } from "@hono/zod-openapi";
import { env } from "cloudflare:workers";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const siteverifySchema = z.object({
  "error-codes": z.array(z.string()).default([]),
  hostname: z.string().optional(),
  success: z.boolean(),
});

/**
 * Validates a Turnstile token server-side. Tokens are single-use and expire after five minutes;
 * the client-side widget alone proves nothing.
 */
export const verifyTurnstile = async (
  token: string,
  remoteIp: string | undefined
): Promise<boolean> => {
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  body.set("idempotency_key", crypto.randomUUID());
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }
  const response = await fetch(SITEVERIFY_URL, { body, method: "POST" });
  if (!response.ok) {
    return false;
  }
  const result = siteverifySchema.safeParse(await response.json());
  return result.success && result.data.success;
};
