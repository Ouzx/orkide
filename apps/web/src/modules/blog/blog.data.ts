import type { Locale } from "@orkide/i18n";
import { locales } from "@orkide/i18n";
import { localizeHref } from "@orkide/i18n/runtime";

import { api, orNotFound, parseResponse } from "@/shared/lib/api.ts";
import type { Alternates } from "@/shared/lib/i18n.ts";

export interface PostListQuery {
  readonly locale: Locale;
  readonly cursor?: string | undefined;
  readonly category?: string | undefined;
  readonly tag?: string | undefined;
  readonly limit?: number;
}

export const listPosts = ({ limit, ...query }: PostListQuery) =>
  parseResponse(
    api.api.posts.$get({
      query: { ...query, limit: limit?.toString() },
    })
  );

/** `undefined` when no published post has this slug in this locale. */
export const getPost = (slug: string, locale: Locale) =>
  orNotFound(
    parseResponse(
      api.api.posts[":slug"].$get({ param: { slug }, query: { locale } })
    )
  );

export const getTaxonomy = (locale: Locale) =>
  parseResponse(api.api.taxonomy.$get({ query: { locale } }));

export type TermKind = "category" | "tag";

/**
 * Finds a term by its localized slug, plus the paths of the same term's page in every locale.
 * Term ids are shared across locales, so the alternates come from matching ids.
 */
export const findTerm = async (
  kind: TermKind,
  slug: string,
  locale: Locale
) => {
  const taxonomies = await Promise.all(
    locales.map(async (each) => [each, await getTaxonomy(each)] as const)
  );
  const pick = (taxonomy: Awaited<ReturnType<typeof getTaxonomy>>) =>
    kind === "category" ? taxonomy.categories : taxonomy.tags;
  const current = taxonomies.find(([each]) => each === locale)?.[1];
  const term = current && pick(current).find((each) => each.slug === slug);
  if (!term) {
    return;
  }
  const alternates: Alternates = {};
  for (const [each, taxonomy] of taxonomies) {
    const match = pick(taxonomy).find((other) => other.id === term.id);
    if (match) {
      alternates[each] = localizeHref(`/blog/${kind}/${match.slug}`, {
        locale: each,
      });
    }
  }
  return { alternates, term };
};
