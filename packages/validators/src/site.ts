import { z } from "zod";

/**
 * Editable site content, one schema per section. A stored section (`site_block`) is validated by
 * its schema; the site ships default content (`site-defaults.ts`) and shows a stored section
 * instead where one exists. Types are inferred from these schemas. A product adds its own
 * sections here, with their shipped content and admin labels.
 */

/** A line of display copy: trimmed, never empty. */
const line = (max: number) => z.string().trim().min(1).max(max);
/** A paragraph of copy. */
const prose = (max: number) => z.string().trim().min(1).max(max);

/** Every section, in the order the site shows it: the admin lists them so. */
export const siteKeys = ["hero"] as const;

export type SiteKey = (typeof siteKeys)[number];

export const siteKeySchema = z.enum(siteKeys);

export const siteSchemas = {
  hero: z.object({
    contactCta: line(40),
    eyebrow: line(80),
    lead: prose(400),
    title: line(160),
    workCta: line(40),
  }),
} as const satisfies Record<SiteKey, z.ZodType>;

/** The whole editable site in one locale. */
export type SiteContent = {
  [Key in SiteKey]: z.infer<(typeof siteSchemas)[Key]>;
};

/** The stored sections of one locale, keyed by section. */
export const siteBlocksSchema = z.partialRecord(siteKeySchema, z.unknown());
