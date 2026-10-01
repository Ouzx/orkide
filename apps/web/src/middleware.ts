import {
  extractLocaleFromRequest,
  extractLocaleFromUrl,
  isExcludedByRouteStrategy,
  localizeUrl,
} from "@orkide/i18n/runtime";
import { paraglideMiddleware } from "@orkide/i18n/server";
import { defineMiddleware } from "astro:middleware";

import { markdownAlternate } from "@/shared/lib/markdown.ts";

/**
 * Locale routing (Paraglide):
 * - A page path without a locale prefix (`/`, `/blog`) redirects to the visitor's locale (cookie,
 *   then `Accept-Language`). The redirect depends on the visitor, so it is never shared-cached.
 * - A localized path (`/tr/portfolyo/x`) is de-localized (`/portfolio/x`) before routing: pages
 *   are written once, and every rendered page is a pure function of its URL — safe to cache.
 *
 * Agents that ask for `text/markdown` get the Markdown alternate of a document page.
 */
export const onRequest = defineMiddleware((context, next) => {
  const { request } = context;
  const url = new URL(request.url);

  if (
    !isExcludedByRouteStrategy(url.href) &&
    extractLocaleFromUrl(url) === undefined
  ) {
    const target = localizeUrl(url, {
      locale: extractLocaleFromRequest(request),
    });
    return new Response(null, {
      headers: {
        "cache-control": "private, no-store",
        location: target.href,
        vary: "accept-language, cookie",
      },
      status: 307,
    });
  }

  return paraglideMiddleware(request, ({ request: delocalized, locale }) => {
    context.locals.locale = locale;
    return next(markdownAlternate(delocalized) ?? delocalized);
  });
});
