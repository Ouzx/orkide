import { locales } from "@orkide/i18n";
import { localizeHref } from "@orkide/i18n/runtime";

import { absoluteUrl } from "@/shared/site.ts";

import type { LocaleInventory } from "./discovery.data.ts";

interface Entry {
  /** Localized path per locale; every entry lists all of its translations. */
  readonly alternates: Partial<Record<string, string>>;
  readonly lastModified?: string | null | undefined;
}

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const STATIC_PAGES = ["/", "/blog", "/portfolio", "/contact"] as const;

const collectEntries = (inventory: readonly LocaleInventory[]): Entry[] => {
  const entries: Entry[] = STATIC_PAGES.map((path) => ({
    alternates: Object.fromEntries(
      locales.map((locale) => [locale, localizeHref(path, { locale })])
    ),
  }));

  // Group translations of the same document by id, so each URL lists its siblings.
  const documents = new Map<string, Entry>();
  const add = (
    id: string,
    locale: string,
    path: string,
    lastModified: string | null
  ) => {
    const entry = documents.get(id) ?? { alternates: {}, lastModified };
    entry.alternates[locale] = path;
    documents.set(id, entry);
  };
  for (const { locale, posts, projects, taxonomy } of inventory) {
    for (const post of posts) {
      add(
        post.id,
        locale,
        localizeHref(`/blog/${post.slug}`, { locale }),
        post.publishedAt
      );
    }
    for (const project of projects) {
      add(
        project.id,
        locale,
        localizeHref(`/portfolio/${project.slug}`, { locale }),
        project.publishedAt
      );
    }
    for (const category of taxonomy.categories) {
      add(
        category.id,
        locale,
        localizeHref(`/blog/category/${category.slug}`, { locale }),
        null
      );
    }
    for (const tag of taxonomy.tags) {
      add(
        tag.id,
        locale,
        localizeHref(`/blog/tag/${tag.slug}`, { locale }),
        null
      );
    }
  }
  return [...entries, ...documents.values()];
};

/** One sitemap with `hreflang` alternates for every localized URL. */
export const buildSitemap = (inventory: readonly LocaleInventory[]): string => {
  const urls = collectEntries(inventory).flatMap((entry) => {
    const links = Object.entries(entry.alternates)
      .map(
        ([hreflang, path]) =>
          `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(absoluteUrl(path ?? "/"))}"/>`
      )
      .join("");
    const lastModified = entry.lastModified
      ? `<lastmod>${entry.lastModified}</lastmod>`
      : "";
    return Object.values(entry.alternates).map(
      (path) =>
        `<url><loc>${escapeXml(absoluteUrl(path ?? "/"))}</loc>${lastModified}${links}</url>`
    );
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
};
