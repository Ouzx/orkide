import { hcWithType } from "@orkide/api/client";
import type { Client } from "@orkide/api/client";
import type { ClientRequestOptions } from "hono/client";

export { PURGE_TAGS_HEADER } from "@orkide/api/client";
export type { CacheTag, Problem } from "@orkide/api/client";
export type { InferRequestType, InferResponseType } from "hono/client";

export const createApiClient = (
  baseUrl: string,
  options?: ClientRequestOptions
): Client => hcWithType(baseUrl, options);

export type ApiClient = Client;
