import { passkeyClient } from "@better-auth/passkey/client";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "./permissions.ts";

/**
 * Browser/React Native auth client. The API is served from the same origin under `/api/auth`,
 * so no base URL is required in the browser.
 */
export const createOrkideAuthClient = (baseURL?: string) =>
  createAuthClient({
    basePath: "/api/auth",
    baseURL,
    plugins: [adminClient({ ac, roles }), passkeyClient()],
  });

export type AuthClient = ReturnType<typeof createOrkideAuthClient>;
