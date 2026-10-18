import type { Locale } from "@orkide/i18n";
import type { ClientRequestOptions } from "hono/client";

import { api, orNotFound, parseResponse } from "@/shared/lib/api.ts";
import { documentAlternates } from "@/shared/lib/i18n.ts";

export interface PostListQuery {
  readonly locale: Locale;
  readonly cursor?: string | undefined;
  readonly category?: string | undefined;
  readonly tag?: string | undefined;
  readonly limit?: number;
}

export const listPosts = (
  { limit, ...query }: PostListQuery,
  options?: ClientRequestOptions
) =>
  parseResponse(
    api.api.posts.$get(
      { query: { ...query, limit: limit?.toString() } },
      options
    )
  );

/** `undefined` when no published post has this slug in this locale. */
export const getPost = (
  slug: string,
  locale: Locale,
  options?: ClientRequestOptions
) =>
  orNotFound(
    parseResponse(
      api.api.posts[":slug"].$get(
        { param: { slug }, query: { locale } },
        options
      )
    )
  );

export const getTaxonomy = (locale: Locale) =>
  parseResponse(api.api.taxonomy.$get({ query: { locale } }));

export type TermKind = "category" | "tag";

/** Finds a term by its localized slug, plus the paths of the same term's page in every locale. */
export const findTerm = (
  taxonomy: Awaited<ReturnType<typeof getTaxonomy>>,
  kind: TermKind,
  slug: string
) => {
  const term = (kind === "category" ? taxonomy.categories : taxonomy.tags).find(
    (each) => each.slug === slug
  );
  return (
    term && {
      alternates: documentAlternates(`/blog/${kind}`, term.alternates),
      term,
    }
  );
};
