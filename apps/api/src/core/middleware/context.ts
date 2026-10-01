import { baseLocale, locales } from "@orkide/i18n";
import { every } from "hono/combine";
import { contextStorage } from "hono/context-storage";
import { languageDetector } from "hono/language";
import { requestId } from "hono/request-id";
import { timing } from "hono/timing";

import { factory } from "../factory.ts";
import { logger } from "../logger.ts";

const levelForStatus = (status: number): "error" | "warn" | "info" => {
  if (status >= 500) {
    return "error";
  }
  return status >= 400 ? "warn" : "info";
};

/** Binds a request-scoped child logger and logs one access line per request. */
const requestLogger = factory.createMiddleware(async (c, next) => {
  const startedAt = performance.now();
  const requestLog = logger.child({
    cfRay: c.req.header("cf-ray"),
    method: c.req.method,
    path: c.req.path,
    requestId: c.var.requestId,
  });
  c.set("logger", requestLog);

  await next();

  const durationMs = Math.round(performance.now() - startedAt);
  requestLog[levelForStatus(c.res.status)](
    { durationMs, status: c.res.status },
    "request completed"
  );
});

/**
 * Per-request context, in order: request id (propagated from `x-request-id` when present),
 * AsyncLocalStorage access via `getContext()`, Server-Timing, logger, and locale negotiation
 * sharing Paraglide's cookie so the API and the web app always agree on the language.
 */
export const requestContext = every(
  requestId(),
  contextStorage(),
  timing({ crossOrigin: false }),
  requestLogger,
  languageDetector({
    caches: false,
    fallbackLanguage: baseLocale,
    lookupCookie: "PARAGLIDE_LOCALE",
    lookupQueryString: "locale",
    order: ["querystring", "cookie", "header"],
    supportedLanguages: [...locales],
  })
);
