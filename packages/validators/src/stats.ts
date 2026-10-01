import { z } from "zod";

import { localeSchema } from "./common.ts";

/** Core Web Vitals reported by the browser (`web-vitals`). */
export const webVitalNames = ["CLS", "FCP", "INP", "LCP", "TTFB"] as const;

/** Beacon sent by the web app: a page view, optionally with one Web Vitals sample. */
export const trackEventSchema = z.discriminatedUnion("type", [
  z.object({
    locale: localeSchema,
    path: z.string().startsWith("/").max(512),
    referrer: z.string().max(512).optional(),
    type: z.literal("pageview"),
  }),
  z.object({
    name: z.enum(webVitalNames),
    path: z.string().startsWith("/").max(512),
    rating: z.enum(["good", "needs-improvement", "poor"]),
    type: z.literal("vital"),
    value: z.number().nonnegative(),
  }),
]);

export const statsRangeQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const statsOverviewSchema = z.object({
  daily: z.array(
    z.object({
      day: z.string(),
      views: z.number().int(),
      visitors: z.number().int(),
    })
  ),
  topPaths: z.array(z.object({ path: z.string(), views: z.number().int() })),
  totals: z.object({ views: z.number().int(), visitors: z.number().int() }),
});

export type TrackEvent = z.infer<typeof trackEventSchema>;
export type StatsOverview = z.infer<typeof statsOverviewSchema>;
