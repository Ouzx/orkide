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
export const siteKeys = ["hero", "stack", "inside", "derive"] as const;

export type SiteKey = (typeof siteKeys)[number];

export const siteKeySchema = z.enum(siteKeys);

export const siteSchemas = {
  /** How to start a product from the template, and where its source is. */
  derive: z.object({
    cta: line(40),
    kicker: line(80),
    lead: prose(400),
    steps: z
      .array(
        z.object({ command: line(120), text: prose(240), title: line(60) })
      )
      .min(3)
      .max(6),
    title: line(160),
    url: z.url({ protocol: /^https$/u }),
  }),
  /**
   * The cover: its words, its buttons, and the parts list of the drawing beside it. The drawing
   * shows nine parts, so the list has exactly nine, in the drawing's order.
   */
  hero: z.object({
    contactCta: line(40),
    deriveCta: line(40),
    eyebrow: line(80),
    lead: prose(400),
    parts: z
      .array(z.object({ name: line(40), qty: line(4), text: prose(160) }))
      .length(9),
    sourceCta: line(40),
    title: line(160),
  }),
  /** What the site is made of: a few readings and the features that matter. */
  inside: z.object({
    features: z
      .array(z.object({ name: line(24), text: prose(300), title: line(80) }))
      .min(3)
      .max(9),
    kicker: line(80),
    lead: prose(400),
    meters: z
      .array(
        z.object({
          label: line(60),
          unit: z.string().trim().max(12),
          value: line(12),
        })
      )
      .length(4),
    title: line(160),
  }),
  /** How the page reached the visitor: five stages, from the edge to the last pixel. */
  stack: z.object({
    kicker: line(80),
    note: line(200),
    stages: z
      .array(
        z.object({
          name: line(24),
          text: prose(400),
          timing: line(40),
          title: line(80),
        })
      )
      .length(5),
    title: line(160),
  }),
} as const satisfies Record<SiteKey, z.ZodType>;

/** The whole editable site in one locale. */
export type SiteContent = {
  [Key in SiteKey]: z.infer<(typeof siteSchemas)[Key]>;
};

/** The stored sections of one locale, keyed by section. */
export const siteBlocksSchema = z.partialRecord(siteKeySchema, z.unknown());
