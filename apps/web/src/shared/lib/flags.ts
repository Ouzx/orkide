import { api, parseResponse } from "./api.ts";

/**
 * Public feature flags (Flagship, evaluated by the API). Pages are shared-cached, so flags are
 * evaluated without visitor context here; a flag flip reaches cached pages within their max-age.
 */
export const getFlags = () => parseResponse(api.api.flags.$get());
