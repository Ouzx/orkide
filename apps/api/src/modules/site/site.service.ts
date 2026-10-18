import { z } from "@hono/zod-openapi";
import type { Locale } from "@orkide/i18n";
import { siteKeys, siteKeySchema, siteSchemas } from "@orkide/validators/site";
import type { SiteContent, SiteKey } from "@orkide/validators/site";
import { siteDefaults } from "@orkide/validators/site-defaults";

import { purge } from "../../core/cache.ts";
import { ApiError, toIssues } from "../../core/errors.ts";
import * as repository from "./site.repository.ts";

interface Block {
  readonly data: SiteContent[SiteKey];
  readonly key: SiteKey;
  readonly updatedAt: Date;
}

/**
 * The stored sections in `locale`. A row whose key or data no longer matches its schema (an older
 * content shape) is skipped: the page then shows the shipped content for that section instead of
 * breaking.
 */
const blocks = async (locale: Locale): Promise<Block[]> => {
  const rows = await repository.listBlocks(locale);
  return rows.flatMap((row) => {
    const key = siteKeySchema.safeParse(row.key);
    const data = key.success && siteSchemas[key.data].safeParse(row.data);
    return key.success && data && data.success
      ? [{ data: data.data, key: key.data, updatedAt: row.updatedAt }]
      : [];
  });
};

/** What the public pages read: section → content. */
export const read = async (
  locale: Locale
): Promise<Partial<Record<SiteKey, SiteContent[SiteKey]>>> => {
  const stored = await blocks(locale);
  return Object.fromEntries(stored.map((block) => [block.key, block.data]));
};

/** Each section's schema as JSON Schema, for the admin to build its forms without Zod. */
const jsonSchemas = new Map<SiteKey, Record<string, unknown>>();
const jsonSchemaOf = (key: SiteKey): Record<string, unknown> => {
  const schema = jsonSchemas.get(key) ?? z.toJSONSchema(siteSchemas[key]);
  jsonSchemas.set(key, schema);
  return schema;
};

interface EditableSection {
  readonly content: SiteContent[SiteKey];
  /** `null`: never saved, the section shows the shipped content. */
  readonly savedAt: Date | null;
  readonly schema: Record<string, unknown>;
}

/**
 * What the admin's editor needs in `locale`: every section's content (saved, else shipped), when
 * it was saved and its schema.
 */
export const readForEditing = async (
  locale: Locale
): Promise<Record<SiteKey, EditableSection>> => {
  const stored = await blocks(locale);
  const saved = new Map(stored.map((block) => [block.key, block]));
  const sections = siteKeys.map((key): [SiteKey, EditableSection] => {
    const block = saved.get(key);
    return [
      key,
      {
        content: block?.data ?? siteDefaults[locale][key],
        savedAt: block?.updatedAt ?? null,
        schema: jsonSchemaOf(key),
      },
    ];
  });
  // Every key is present: the entries come from `siteKeys`.
  return Object.fromEntries(sections) as Record<SiteKey, EditableSection>;
};

export const save = async (
  key: SiteKey,
  locale: Locale,
  data: unknown
): Promise<void> => {
  const parsed = siteSchemas[key].safeParse(data);
  if (!parsed.success) {
    throw new ApiError("validation_failed", {
      issues: toIssues(parsed.error),
    });
  }
  await repository.saveBlock(locale, key, parsed.data);
  await purge("site");
};

/** Drops the stored section, so the page shows the shipped content again. */
export const reset = async (key: SiteKey, locale: Locale): Promise<void> => {
  if (!(await repository.deleteBlock(locale, key))) {
    throw new ApiError("not_found");
  }
  await purge("site");
};
