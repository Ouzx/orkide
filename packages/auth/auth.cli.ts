/**
 * Entry point for the Better Auth CLI only (`pnpm auth:generate`).
 * It mirrors the runtime options so the generated Drizzle schema always matches the plugins in use.
 */
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import { createAuthOptions } from "./src/options.ts";

export const auth = betterAuth({
  ...createAuthOptions({
    baseURL: "http://localhost:4321",
    github: {
      clientId: "schema-generation",
      clientSecret: "schema-generation",
    },
    secret: "schema-generation-only-secret-value-0000",
  }),
  database: drizzleAdapter({}, { provider: "sqlite" }),
});
