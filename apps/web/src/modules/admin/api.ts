import { createApiClient } from "@orkide/api-client";
import type { Problem } from "@orkide/api-client";
import type { Locale } from "@orkide/i18n";
import { queryOptions } from "@tanstack/react-query";
import { DetailedError, parseResponse } from "hono/client";

/** Browser client: same origin, so the session cookie and CSRF origin come for free. */
export const api = createApiClient(
  globalThis.location?.origin ?? "http://localhost"
);

export { parseResponse } from "hono/client";

/** Extracts the RFC 9457 problem body from a failed `parseResponse` call (`detail.data`). */
export const problemOf = (error: unknown): Partial<Problem> | undefined => {
  if (!(error instanceof DetailedError)) {
    return undefined;
  }
  const detail: unknown = error.detail;
  if (typeof detail !== "object" || detail === null || !("data" in detail)) {
    return undefined;
  }
  const { data } = detail;
  return typeof data === "object" && data !== null
    ? (data as Partial<Problem>)
    : undefined;
};

/** Query keys and fetchers, one place per resource (invalidate by the first segment). */
export const queries = {
  media: () =>
    queryOptions({
      queryFn: () => parseResponse(api.api.admin.media.$get({ query: {} })),
      queryKey: ["media"],
    }),
  messages: () =>
    queryOptions({
      queryFn: () => parseResponse(api.api.admin.messages.$get({ query: {} })),
      queryKey: ["messages"],
    }),
  post: (id: string) =>
    queryOptions({
      queryFn: () =>
        parseResponse(api.api.admin.posts[":id"].$get({ param: { id } })),
      queryKey: ["posts", id],
    }),
  posts: () =>
    queryOptions({
      queryFn: () => parseResponse(api.api.admin.posts.$get()),
      queryKey: ["posts"],
    }),
  project: (id: string) =>
    queryOptions({
      queryFn: () =>
        parseResponse(api.api.admin.projects[":id"].$get({ param: { id } })),
      queryKey: ["projects", id],
    }),
  projects: () =>
    queryOptions({
      queryFn: () => parseResponse(api.api.admin.projects.$get()),
      queryKey: ["projects"],
    }),
  stats: (days: number) =>
    queryOptions({
      queryFn: () =>
        parseResponse(
          api.api.admin.stats.$get({ query: { days: days.toString() } })
        ),
      queryKey: ["stats", days],
    }),
  taxonomy: () =>
    queryOptions({
      queryFn: () => parseResponse(api.api.admin.taxonomy.$get()),
      queryKey: ["taxonomy"],
    }),
  vitals: (days: number) =>
    queryOptions({
      queryFn: () =>
        parseResponse(
          api.api.admin.stats.vitals.$get({ query: { days: days.toString() } })
        ),
      queryKey: ["vitals", days],
    }),
};

/** Picks the translation for `locale`, falling back to the first one. */
export const translationFor = <T extends { locale: Locale }>(
  translations: readonly T[],
  locale: Locale
): T | undefined =>
  translations.find((translation) => translation.locale === locale) ??
  translations[0];

/** Human-readable failure: the API's localized problem title, else the transport message. */
export const errorMessage = (error: unknown): string =>
  problemOf(error)?.title ??
  (error instanceof Error ? error.message : String(error));
