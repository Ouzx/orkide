import { baseLocale } from "@orkide/i18n";
import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { localizeHref } from "@orkide/i18n/runtime";

import { localeName } from "@/shared/lib/i18n.ts";
import { absoluteUrl, owner } from "@/shared/site.ts";

import type { LocaleInventory } from "./discovery.data.ts";
import { postDetails, projectDetails } from "./discovery.data.ts";

const link = (title: string, path: string, summary: string) =>
  `- [${title}](${absoluteUrl(`${path}.md`)}): ${summary.replaceAll("\n", " ")}`;

const section = (inventory: LocaleInventory): string => {
  const { locale, posts, projects } = inventory;
  const options = { locale };
  const language = localeName(locale);
  return [
    `## ${m.blog_title({}, options)} (${language})`,
    "",
    ...posts.map((post) =>
      link(
        post.title,
        localizeHref(`/blog/${post.slug}`, options),
        post.summary
      )
    ),
    "",
    `## ${m.portfolio_title({}, options)} (${language})`,
    "",
    ...projects.map((project) =>
      link(
        project.title,
        localizeHref(`/portfolio/${project.slug}`, options),
        project.summary
      )
    ),
  ].join("\n");
};

/**
 * `/llms.txt` (https://llmstxt.org): what the site is, then every document as a link to its
 * Markdown alternate. The base locale comes first; translations follow.
 */
export const buildLlmsTxt = (
  inventories: readonly LocaleInventory[]
): string => {
  const options: { locale: Locale } = { locale: baseLocale };
  const ordered = inventories.toSorted(
    (a, b) => Number(b.locale === baseLocale) - Number(a.locale === baseLocale)
  );
  return [
    `# ${m.site_name({}, options)}`,
    "",
    `> ${m.home_description({}, options)}`,
    "",
    m.llms_intro(
      {
        api: absoluteUrl("/api/openapi.json"),
        corpus: absoluteUrl("/llms-full.txt"),
        name: owner.name,
      },
      options
    ),
    "",
    ordered.map(section).join("\n\n"),
    "",
  ].join("\n");
};

const fullDocument = (title: string, url: string, markdown: string) =>
  `# ${title}\n\nSource: ${url}\n\n${markdown.trim()}\n`;

/** `/llms-full.txt`: every published document, in full, as one Markdown corpus. */
export const buildLlmsFullTxt = async (
  inventories: readonly LocaleInventory[]
): Promise<string> => {
  const documents = await Promise.all(
    inventories.map(async ({ locale, posts, projects }) => {
      const options: { locale: Locale } = { locale };
      const [postDocs, projectDocs] = await Promise.all([
        postDetails(locale, posts),
        projectDetails(locale, projects),
      ]);
      return [
        ...postDocs.map((post) =>
          fullDocument(
            post.title,
            absoluteUrl(localizeHref(`/blog/${post.slug}`, options)),
            post.markdown
          )
        ),
        ...projectDocs.map((project) =>
          fullDocument(
            project.title,
            absoluteUrl(localizeHref(`/portfolio/${project.slug}`, options)),
            project.markdown
          )
        ),
      ];
    })
  );
  return `${documents.flat().join("\n---\n\n")}\n`;
};
