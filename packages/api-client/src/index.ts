import { hcWithType } from "@orkide/api/client";
import type { Client } from "@orkide/api/client";
import type { ClientRequestOptions } from "hono/client";

export type { InferRequestType, InferResponseType } from "hono/client";

/**
 * End-to-end typed client for the Orkide API, shared by the web app and future native clients.
 *
 * In the browser and in the web Worker the API is same-origin (`/api` is forwarded through a
 * Service Binding); native clients pass the absolute API origin.
 */
export const createApiClient = (
  baseUrl: string,
  options?: ClientRequestOptions
): Client => hcWithType(baseUrl, options);

export type ApiClient = Client;
