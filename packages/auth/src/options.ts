import { passkey } from "@better-auth/passkey";
import { generateId } from "@orkide/db/columns";
import type { BetterAuthOptions } from "better-auth";
import { admin } from "better-auth/plugins";

import { ac, roles } from "./permissions.ts";

export interface AuthRuntimeOptions {
  /** Public origin of the site, e.g. `https://orkide.example.workers.dev`. */
  readonly baseURL: string;
  readonly secret: string;
  readonly github: { readonly clientId: string; readonly clientSecret: string };
}

/** Lifetime of a session and the window after which its expiry is pushed forward. */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_REFRESH_SECONDS = 60 * 60 * 24;
/** Signed session cookie cache: avoids a D1 read on every authenticated request. */
const SESSION_COOKIE_CACHE_SECONDS = 60 * 5;

/**
 * Better Auth configuration shared by the runtime instance and the schema generator.
 * The database adapter is attached separately so this module never touches a binding.
 */
export const createAuthOptions = ({
  baseURL,
  secret,
  github,
}: AuthRuntimeOptions) => {
  const { hostname } = new URL(baseURL);

  return {
    advanced: {
      cookiePrefix: "orkide",
      database: { generateId },
      useSecureCookies: baseURL.startsWith("https://"),
    },
    appName: "Orkide",
    basePath: "/api/auth",
    baseURL,
    emailAndPassword: { enabled: false },
    plugins: [
      admin({ ac, adminRoles: ["owner"], defaultRole: "viewer", roles }),
      passkey({ origin: baseURL, rpID: hostname, rpName: "Orkide" }),
    ],
    // Throttling is enforced at the edge by the Rate Limiting binding in the API Worker.
    rateLimit: { enabled: false },
    secret,
    session: {
      cookieCache: { enabled: true, maxAge: SESSION_COOKIE_CACHE_SECONDS },
      expiresIn: SESSION_TTL_SECONDS,
      updateAge: SESSION_REFRESH_SECONDS,
    },
    socialProviders: {
      github: { clientId: github.clientId, clientSecret: github.clientSecret },
    },
    trustedOrigins: [baseURL],
  } satisfies BetterAuthOptions;
};
