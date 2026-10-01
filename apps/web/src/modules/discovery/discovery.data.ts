import type { Locale } from "@orkide/i18n";
import { locales } from "@orkide/i18n";
import type { PostSummary, ProjectSummary } from "@orkide/validators/content";

import { getPost, getTaxonomy, listPosts } from "@/modules/blog/blog.data.ts";
import {
  getProject,
  listProjects,
} from "@/modules/portfolio/portfolio.data.ts";

/** Upper bound for one listing page (the API's maximum). */
const PAGE_SIZE = 50;

/** Every published post in `locale`, following the keyset cursor to the end. */
export const allPosts = async (locale: Locale): Promise<PostSummary[]> => {
  const posts: PostSummary[] = [];
  let cursor: string | undefined;
  do {
    // Pages depend on the previous cursor, so they are fetched in sequence.
    // oxlint-disable-next-line no-await-in-loop
    const page = await listPosts({ cursor, limit: PAGE_SIZE, locale });
    posts.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);
  return posts;
};

export interface LocaleInventory {
  readonly locale: Locale;
  readonly posts: PostSummary[];
  readonly projects: ProjectSummary[];
  readonly taxonomy: Awaited<ReturnType<typeof getTaxonomy>>;
}

/** Everything published, per locale — the source for the sitemap and `llms.txt`. */
export const inventory = (): Promise<LocaleInventory[]> =>
  Promise.all(
    locales.map(async (locale) => {
      const [posts, projects, taxonomy] = await Promise.all([
        allPosts(locale),
        listProjects(locale),
        getTaxonomy(locale),
      ]);
      return { locale, posts, projects, taxonomy };
    })
  );

/** Full documents (with Markdown and HTML) for the given summaries, in parallel. */
export const postDetails = async (
  locale: Locale,
  posts: readonly PostSummary[]
) => {
  const details = await Promise.all(
    posts.map((post) => getPost(post.slug, locale))
  );
  return details.filter((post) => post !== undefined);
};

export const projectDetails = async (
  locale: Locale,
  projects: readonly ProjectSummary[]
) => {
  const details = await Promise.all(
    projects.map((project) => getProject(project.slug, locale))
  );
  return details.filter((project) => project !== undefined);
};
