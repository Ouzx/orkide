/**
 * Identity of the site owner, used by JSON-LD, feeds and the footer.
 * Edit here — every surface reads from this object.
 */
export const owner = {
  github: "https://github.com/Ouzx",
  name: "Oğuzhan Kandakoğlu",
} as const;

/** Public origin, from `site` in `astro.config.ts`. */
export const siteUrl = new URL(import.meta.env.SITE);

export const absoluteUrl = (path: string): string =>
  new URL(path, siteUrl).href;

/**
 * The same path and query on the public origin. The path is set, not resolved, so a path such as
 * `//evil.example` stays a path on this site instead of becoming another host.
 */
export const onSite = (url: URL): URL => {
  const target = new URL(siteUrl);
  target.pathname = url.pathname;
  target.search = url.search;
  return target;
};
