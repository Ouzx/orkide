import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { localizeHref } from "@orkide/i18n/runtime";
import { Feed } from "feed";

import { listPosts } from "@/modules/blog/blog.data.ts";
import { languageTag } from "@/shared/lib/i18n.ts";
import { absoluteUrl, owner, siteUrl } from "@/shared/site.ts";

import { postDetails } from "./discovery.data.ts";

/** Feeds carry the latest posts with their full content. */
const FEED_SIZE = 20;

export const FEED_FORMATS = {
  atom: { contentType: "application/atom+xml", file: "atom.xml" },
  json: { contentType: "application/feed+json", file: "feed.json" },
  rss: { contentType: "application/rss+xml", file: "rss.xml" },
} as const;

export type FeedFormat = keyof typeof FEED_FORMATS;

/** Builds the blog feed of `locale` in `format` (RSS 2.0, Atom 1.0 or JSON Feed 1.1). */
export const buildFeed = async (
  locale: Locale,
  format: FeedFormat
): Promise<Response> => {
  const options = { locale };
  const site = m.site_name({}, options);
  const page = await listPosts({ limit: FEED_SIZE, locale });
  const posts = await postDetails(locale, page.items);
  const author = { link: siteUrl.origin, name: owner.name };

  const feed = new Feed({
    author,
    copyright: m.footer_copyright(
      { name: owner.name, year: new Date().getFullYear().toString() },
      options
    ),
    description: m.blog_description({}, options),
    favicon: absoluteUrl("/favicon.svg"),
    feedLinks: Object.fromEntries(
      Object.entries(FEED_FORMATS).map(([key, value]) => [
        key,
        absoluteUrl(`/${locale}/${value.file}`),
      ])
    ),
    generator: false,
    id: absoluteUrl(localizeHref("/blog", options)),
    language: languageTag[locale],
    link: absoluteUrl(localizeHref("/blog", options)),
    title: m.feed_title({ site }, options),
    updated: posts[0] ? new Date(posts[0].updatedAt) : new Date(0),
  });

  for (const post of posts) {
    const link = absoluteUrl(localizeHref(`/blog/${post.slug}`, options));
    feed.addItem({
      author: [author],
      category: post.tags.map((tag) => ({ name: tag.name })),
      content: post.html,
      date: new Date(post.updatedAt),
      description: post.summary,
      id: link,
      image: post.cover ? absoluteUrl(`${post.cover.url}?w=1280`) : undefined,
      link,
      published: post.publishedAt ? new Date(post.publishedAt) : undefined,
      title: post.title,
    });
  }

  const render = {
    atom: () => feed.atom1(),
    json: () => feed.json1(),
    rss: () => feed.rss2(),
  }[format];
  return new Response(render(), {
    headers: {
      "content-type": `${FEED_FORMATS[format].contentType}; charset=utf-8`,
    },
  });
};
