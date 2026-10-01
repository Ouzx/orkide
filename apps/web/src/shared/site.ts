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
