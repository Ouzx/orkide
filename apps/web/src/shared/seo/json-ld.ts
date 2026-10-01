import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import type { PostDetail, ProjectDetail } from "@orkide/validators/content";
import type {
  BlogPosting,
  BreadcrumbList,
  CreativeWork,
  Graph,
  Person,
  Thing,
  WebSite,
} from "schema-dts";

import { languageTag } from "@/shared/lib/i18n.ts";
import { absoluteUrl, owner, siteUrl } from "@/shared/site.ts";

/** Stable node identifiers, so every page's graph links to the same Person and WebSite. */
const PERSON_ID = `${siteUrl.origin}/#person`;
const WEBSITE_ID = `${siteUrl.origin}/#website`;

export const personNode = (): Person => ({
  "@id": PERSON_ID,
  "@type": "Person",
  image: absoluteUrl("/media/portrait.jpg"),
  name: owner.name,
  sameAs: [owner.github],
  url: siteUrl.origin,
});

export const websiteNode = (locale: Locale): WebSite => ({
  "@id": WEBSITE_ID,
  "@type": "WebSite",
  description: m.home_description({}, { locale }),
  inLanguage: languageTag[locale],
  name: m.site_name({}, { locale }),
  publisher: { "@id": PERSON_ID },
  url: siteUrl.origin,
});

export const breadcrumbNode = (
  items: readonly { name: string; path: string }[]
): BreadcrumbList => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    item: absoluteUrl(item.path),
    name: item.name,
    position: index + 1,
  })),
});

export const blogPostingNode = (
  post: PostDetail,
  path: string
): BlogPosting => ({
  "@type": "BlogPosting",
  author: { "@id": PERSON_ID },
  dateModified: post.updatedAt,
  datePublished: post.publishedAt ?? undefined,
  description: post.seoDescription ?? post.summary,
  headline: post.title,
  image: post.cover ? absoluteUrl(post.cover.url) : undefined,
  inLanguage: languageTag[post.locale],
  isPartOf: { "@id": WEBSITE_ID },
  keywords: post.tags.map((tag) => tag.name),
  mainEntityOfPage: absoluteUrl(path),
  publisher: { "@id": PERSON_ID },
  timeRequired: `PT${post.readingTimeMinutes}M`,
  url: absoluteUrl(path),
});

export const projectNode = (
  project: ProjectDetail,
  path: string
): CreativeWork => ({
  "@type": "CreativeWork",
  creator: { "@id": PERSON_ID },
  dateCreated: project.startedAt ?? undefined,
  dateModified: project.updatedAt,
  datePublished: project.publishedAt ?? undefined,
  description: project.seoDescription ?? project.summary,
  image: project.cover ? absoluteUrl(project.cover.url) : undefined,
  inLanguage: languageTag[project.locale],
  keywords: project.tags.map((tag) => tag.name),
  name: project.title,
  sameAs: [project.websiteUrl, project.repositoryUrl].filter(
    (url): url is string => url !== null
  ),
  url: absoluteUrl(path),
});

/** One `@graph` per page: the site-wide nodes plus whatever the page describes. */
export const graph = (locale: Locale, ...nodes: Thing[]): Graph => ({
  "@context": "https://schema.org",
  "@graph": [personNode(), websiteNode(locale), ...nodes],
});

/**
 * Serializes JSON-LD for an inline `<script type="application/ld+json">`. `<` is escaped so content
 * can never close the script element.
 */
export const serializeJsonLd = (value: Graph): string =>
  JSON.stringify(value).replaceAll("<", String.raw`<`);
