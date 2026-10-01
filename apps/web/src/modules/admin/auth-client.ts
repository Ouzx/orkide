import { createOrkideAuthClient } from "@orkide/auth/client";

/** Better Auth browser client (same origin, `/api/auth`). */
export const authClient = createOrkideAuthClient();
