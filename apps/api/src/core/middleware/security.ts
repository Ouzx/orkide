import { env } from "cloudflare:workers";
import { bodyLimit } from "hono/body-limit";
import { every, except } from "hono/combine";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

import { ApiError } from "../errors.ts";

/** Default request body ceiling; upload routes opt into a larger limit explicitly. */
export const DEFAULT_BODY_LIMIT_BYTES = 256 * 1024;

/** Routes that accept file uploads and therefore enforce their own body limit. */
const UPLOAD_PATHS = ["/api/admin/media"];

export const limitBody = (maxSize: number) =>
  bodyLimit({
    maxSize,
    onError: () => {
      throw new ApiError("payload_too_large");
    },
  });

/**
 * Baseline hardening for every API response: strict security headers (the API never serves
 * HTML, so its CSP denies everything), Origin checks on state-changing requests, and a body cap.
 */
export const security = every(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
    crossOriginResourcePolicy: "same-site",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
  }),
  csrf({ origin: [new URL(env.BETTER_AUTH_URL).origin] }),
  // Upload routes apply their own, larger ceiling.
  except(UPLOAD_PATHS, limitBody(DEFAULT_BODY_LIMIT_BYTES))
);
