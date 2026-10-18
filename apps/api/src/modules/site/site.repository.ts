import { db } from "@orkide/db";
import { siteBlock } from "@orkide/db/schema";
import type { Locale } from "@orkide/i18n";
import type { SiteKey } from "@orkide/validators/site";
import { and, eq } from "drizzle-orm";

export const listBlocks = (locale: Locale) =>
  db
    .select({
      data: siteBlock.data,
      key: siteBlock.key,
      updatedAt: siteBlock.updatedAt,
    })
    .from(siteBlock)
    .where(eq(siteBlock.locale, locale));

export const saveBlock = async (
  locale: Locale,
  key: SiteKey,
  data: unknown
): Promise<void> => {
  await db
    .insert(siteBlock)
    .values({ data, key, locale })
    .onConflictDoUpdate({
      set: { data, updatedAt: new Date() },
      target: [siteBlock.locale, siteBlock.key],
    });
};

/** Whether a stored section existed (and is now gone). */
export const deleteBlock = async (
  locale: Locale,
  key: SiteKey
): Promise<boolean> => {
  const removed = await db
    .delete(siteBlock)
    .where(and(eq(siteBlock.locale, locale), eq(siteBlock.key, key)))
    .returning({ id: siteBlock.id });
  return removed.length > 0;
};
