import type { Locale } from "@orkide/i18n";
import { localizeHref } from "@orkide/i18n/runtime";

/**
 * Renders the 404 page in the current locale. Rewrites pass through the middleware again, so the
 * target must be localized — an unprefixed `/404` would be redirected.
 */
export const notFound = (
  context: { rewrite: (path: string) => Promise<Response> },
  locale: Locale
): Promise<Response> => context.rewrite(localizeHref("/404", { locale }));
