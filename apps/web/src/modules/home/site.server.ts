import type { Locale } from "@orkide/i18n";
import { siteKeys, siteSchemas } from "@orkide/validators/site";
import type { SiteContent, SiteKey } from "@orkide/validators/site";
import { siteDefaults } from "@orkide/validators/site-defaults";

import { api, parseResponse } from "@/shared/lib/api.ts";

/**
 * The site's content in `locale`: the sections the admin saved, over the shipped ones. Pages that
 * render it are cached under the `site` tag, which every save purges.
 */
export const loadSite = async (locale: Locale): Promise<SiteContent> => {
  const defaults = siteDefaults[locale];
  let stored: Partial<Record<SiteKey, unknown>>;
  try {
    stored = await parseResponse(api.api.site.$get({ query: { locale } }));
  } catch {
    // The API is unreachable: the page still renders, with the shipped content.
    return defaults;
  }
  // Each saved section is checked again here, so the page can never receive a malformed one.
  const pick = <Key extends SiteKey>(key: Key): SiteContent[Key] => {
    const parsed = siteSchemas[key].safeParse(stored[key]);
    // `SiteContent[Key]` is inferred from this very schema; TypeScript cannot follow a generic key.
    return parsed.success ? (parsed.data as SiteContent[Key]) : defaults[key];
  };
  // Every key is present: the entries come from `siteKeys`.
  return Object.fromEntries(
    siteKeys.map((key) => [key, pick(key)])
  ) as SiteContent;
};
