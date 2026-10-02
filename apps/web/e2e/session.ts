import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import type { BrowserContext } from "@playwright/test";

const SESSION_TOKEN = "e2e-session-token";

/** The secret the local API signs cookies with: `.dev.vars` in apps/api. */
const authSecret = (): string => {
  const vars = readFileSync(
    path.resolve(import.meta.dirname, "../../api/.dev.vars"),
    "utf-8"
  );
  const line = vars
    .split("\n")
    .find((entry) => entry.startsWith("BETTER_AUTH_SECRET="));
  const value = line?.slice("BETTER_AUTH_SECRET=".length).trim();
  if (!value) {
    throw new Error("BETTER_AUTH_SECRET is missing from apps/api/.dev.vars");
  }
  return value.replaceAll(/^['"]|['"]$/gu, "");
};

/** Signs in as the seeded owner (apps/api/seed/e2e.sql) by setting a signed session cookie. */
export const signInAsOwner = async (context: BrowserContext): Promise<void> => {
  const signature = createHmac("sha256", authSecret())
    .update(SESSION_TOKEN)
    .digest("base64");
  await context.addCookies([
    {
      name: "orkide.session_token",
      url: "http://localhost:4322",
      value: encodeURIComponent(`${SESSION_TOKEN}.${signature}`),
    },
  ]);
};
