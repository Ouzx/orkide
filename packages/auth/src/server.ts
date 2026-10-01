import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@orkide/db";
import * as schema from "@orkide/db/schema";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { env } from "cloudflare:workers";
import { z } from "zod";

import { createAuthOptions } from "./options.ts";
import type { Role } from "./permissions.ts";

/** Bindings this package reads. Validated once at module load so misconfiguration fails fast. */
const authEnvSchema = z.object({
  /** Comma-separated emails allowed to sign in; each becomes an `owner`. */
  ADMIN_EMAILS: z
    .string()
    .min(1)
    .transform(
      (value) =>
        new Set(value.split(",").map((email) => email.trim().toLowerCase()))
    ),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

const authEnv = authEnvSchema.parse(env);
const OWNER: Role = "owner";

/**
 * Process-wide Better Auth instance. Sign-up is closed: only allow-listed emails can create an
 * account, and they are provisioned as owners. Further users are invited by an owner.
 */
export const auth = betterAuth({
  ...createAuthOptions({
    baseURL: authEnv.BETTER_AUTH_URL,
    github: {
      clientId: authEnv.GITHUB_CLIENT_ID,
      clientSecret: authEnv.GITHUB_CLIENT_SECRET,
    },
    secret: authEnv.BETTER_AUTH_SECRET,
  }),
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  databaseHooks: {
    user: {
      create: {
        before: (user) => {
          if (!authEnv.ADMIN_EMAILS.has(user.email.toLowerCase())) {
            throw new APIError("FORBIDDEN", {
              message: "Sign-up is restricted.",
            });
          }
          return Promise.resolve({ data: { ...user, role: OWNER } });
        },
      },
    },
  },
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];

export {
  statements,
  roles,
  type Permissions,
  type Role,
} from "./permissions.ts";
