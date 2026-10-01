import { auth } from "@orkide/auth";
import type { Role } from "@orkide/auth";
import { db, generateId } from "@orkide/db";
import { user } from "@orkide/db/schema";
import { makeSignature } from "better-auth/crypto";
import { env, exports } from "cloudflare:workers";

export const ORIGIN = "http://localhost:4321";

/** Sends a request through the Worker's real fetch handler (full middleware stack). */
export const request = (path: string, init: RequestInit = {}) =>
  exports.default.fetch(new Request(`${ORIGIN}${path}`, init));

export const jsonRequest = (
  path: string,
  method: string,
  body: unknown,
  headers: HeadersInit = {}
) =>
  request(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", origin: ORIGIN, ...headers },
    method,
  });

/**
 * Creates a user with `role` and a real Better Auth session, returning the signed session cookie.
 * The user row is inserted directly so tests can provision roles the closed sign-up hook forbids.
 */
export const signInAs = async (
  role: Role
): Promise<{ cookie: string; userId: string }> => {
  const userId = generateId();
  await db.insert(user).values({
    email: `${role}-${userId}@orkide.test`,
    emailVerified: true,
    id: userId,
    name: `Test ${role}`,
    role,
  });
  const context = await auth.$context;
  const session = await context.internalAdapter.createSession(userId);
  const signature = await makeSignature(session.token, env.BETTER_AUTH_SECRET);
  return {
    cookie: `orkide.session_token=${encodeURIComponent(`${session.token}.${signature}`)}`,
    userId,
  };
};
