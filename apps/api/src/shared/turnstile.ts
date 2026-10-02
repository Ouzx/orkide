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
 * Cloudflare's dummy secret keys (always pass, always fail, already spent) used in development and
 * CI. Their tokens report `hostname: "example.com"`, so the hostname cannot be checked for them.
 */
const TEST_SECRET_KEY = /^[123]x0{33}AA$/u;

/**
 * Validates a Turnstile token server-side: the challenge was passed, and on this site's hostname.
 * Tokens are single-use and expire after five minutes; the client-side widget alone proves nothing.
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
  if (!(result.success && result.data.success)) {
    return false;
  }
  // A token solved on another site that embeds the same widget must not count here.
  return (
    TEST_SECRET_KEY.test(env.TURNSTILE_SECRET_KEY) ||
    result.data.hostname === new URL(env.BETTER_AUTH_URL).hostname
  );
};
