import { hc } from "hono/client";

import type { AppType } from "./app.ts";

/**
 * Pre-instantiated RPC client type (Hono's `hcWithType` pattern). Emitting this as a declaration
 * lets consumers get end-to-end types without compiling the API's sources or its Worker types.
 */
const client = hc<AppType>("");
export type Client = typeof client;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);
