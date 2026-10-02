import { ApiError } from "../errors.ts";
import { factory } from "../factory.ts";

/** Both bindings use a 60 s window, so a throttled client can retry once it rolls over. */
const RETRY_AFTER_SECONDS = "60";

type RateLimiterBinding = "RATE_LIMIT_API" | "RATE_LIMIT_STRICT";

/**
 * Throttles requests with a Workers Rate Limiting binding, keyed by client IP and route scope.
 * Limits are configured per binding in `wrangler.jsonc`.
 *
 * The edge stamps `cf-connecting-ip` on every public request. A request without it never came
 * from a visitor: it is the web Worker's server-side render calling over the Service Binding.
 * Counting those would pool every page render under one shared key and throttle all visitors
 * together, so they are not limited. Local development is not limited either: the dev server,
 * the end-to-end suite and Lighthouse all share one IP and would only throttle themselves.
 */
export const rateLimit = (binding: RateLimiterBinding, scope: string) =>
  factory.createMiddleware(async (c, next) => {
    const ip = c.req.header("cf-connecting-ip");
    if (!ip || c.env.ENVIRONMENT === "development") {
      await next();
      return;
    }
    const { success } = await c.env[binding].limit({ key: `${scope}:${ip}` });
    if (!success) {
      throw new ApiError("rate_limited", {
        headers: { "retry-after": RETRY_AFTER_SECONDS },
      });
    }
    await next();
  });
