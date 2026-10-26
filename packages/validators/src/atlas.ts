import { z } from "zod";

import { localeSchema } from "./common.ts";

/**
 * The design atlas: a catalog of web techniques, each one a live specimen. A specimen is one file
 * in the web app (`modules/atlas/specimens/<slug>.ts`, plus an optional `<slug>.css`) that exports
 * its entry (validated here) and its preview. IDs are permanent: a family code and a number,
 * never renumbered or reused. Prompts and the mix brief are written for agents, so they stay in
 * English; names and descriptions are translated.
 */

/** The families, in catalog order. */
export const atlasFamilies = [
  "motion",
  "generative",
  "play",
  "spatial",
  "aesthetic",
  "senses",
] as const;

export type AtlasFamily = (typeof atlasFamilies)[number];

/** Each family's two-letter code, the first half of its specimens' IDs. */
export const atlasFamilyCodes = {
  aesthetic: "AE",
  generative: "GN",
  motion: "MO",
  play: "PH",
  senses: "SN",
  spatial: "SP",
} as const satisfies Record<AtlasFamily, string>;

/** How reliably an agent builds it: in one pass, after a styling round, or after a tuning pass. */
export const atlasFits = ["strong", "good", "tune"] as const;

/** What it costs at runtime: CSS or SVG only, a canvas loop or a small library, WebGL, physics or audio. */
export const atlasCosts = ["light", "medium", "heavy"] as const;

/** What the preview invites the visitor to do. */
export const atlasHints = [
  "move",
  "drag",
  "click",
  "tap",
  "hover",
  "slider",
] as const;

export const specimenIdSchema = z
  .string()
  .regex(
    /^(?:MO|GN|PH|SP|AE|SN)-\d{2}$/u,
    "Expected a family code and a number, like GN-07"
  );

const text = (max: number) => z.string().trim().min(1).max(max);
/** One string per site locale: a new locale must translate every specimen. */
const translated = (max: number) => z.record(localeSchema, text(max));

export const specimenSchema = z.object({
  /** The month it joined the atlas (YYYY-MM). */
  added: z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/u),
  cost: z.enum(atlasCosts),
  /** What a visitor sees and feels, in a sentence or two. */
  desc: translated(240),
  /** The preview takes touch for itself (dragging), instead of letting the page scroll. */
  drag: z.boolean().optional(),
  family: z.enum(atlasFamilies),
  fit: z.enum(atlasFits),
  hint: z.enum(atlasHints).optional(),
  id: specimenIdSchema,
  name: translated(60),
  /** Specimens it combines well with in a mix. */
  pairs: z.array(specimenIdSchema).max(6),
  /** A prompt starter for an agent, in English, with `[subject]` where the page's subject goes. */
  prompt: text(900).refine(
    (value) => value.includes("[subject]") || value.includes("[concept]"),
    "A prompt starter names its [subject] (or [concept])"
  ),
  /** Real sites or demos worth studying: only links someone actually opened. */
  refs: z
    .array(z.object({ label: text(60), url: z.url({ protocol: /^https$/u }) }))
    .min(1)
    .max(5),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
  tags: z.array(text(32)).min(1).max(4),
});

export type Specimen = z.infer<typeof specimenSchema>;
/** What a specimen file writes (`satisfies SpecimenInput`). */
export type SpecimenInput = z.input<typeof specimenSchema>;

/** The whole catalog: unique IDs and slugs, IDs that match their family, pairs that exist. */
export const atlasSchema = z
  .array(specimenSchema)
  .superRefine((specimens, ctx) => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    for (const [index, specimen] of specimens.entries()) {
      if (!specimen.id.startsWith(`${atlasFamilyCodes[specimen.family]}-`)) {
        ctx.addIssue({
          code: "custom",
          message: `${specimen.id} is not in the ${specimen.family} family`,
          path: [index, "id"],
        });
      }
      if (ids.has(specimen.id) || slugs.has(specimen.slug)) {
        ctx.addIssue({
          code: "custom",
          message: `${specimen.id} (${specimen.slug}) appears twice`,
          path: [index],
        });
      }
      ids.add(specimen.id);
      slugs.add(specimen.slug);
    }
    for (const [index, specimen] of specimens.entries()) {
      for (const pair of specimen.pairs) {
        if (!ids.has(pair) || pair === specimen.id) {
          ctx.addIssue({
            code: "custom",
            message: `${specimen.id} pairs with ${pair}, which is not another specimen`,
            path: [index, "pairs"],
          });
        }
      }
    }
  });
