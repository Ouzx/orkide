import { createApiClient } from "@orkide/api-client";
import { env } from "cloudflare:workers";
import { DetailedError } from "hono/client";

export { parseResponse } from "hono/client";

/**
 * Server-side API client. Requests travel over the Service Binding (in-process, no public network)
 * and hit the API Worker's own cache first, so a cached page render costs no database query.
 * The host is a placeholder — only the path matters — and is `localhost` because the API's Vite
 * dev server (reached through the local dev registry) rejects unknown hosts.
 */
export const api = createApiClient("http://localhost", {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    env.API.fetch(input, init),
});

/** Resolves to `undefined` when `request` failed with 404; rethrows every other failure. */
export const orNotFound = async <T>(request: Promise<T>) => {
  try {
    return await request;
  } catch (error) {
    if (error instanceof DetailedError && error.statusCode === 404) {
      return;
    }
    throw error;
  }
};
