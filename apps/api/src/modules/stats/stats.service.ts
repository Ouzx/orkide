import { z } from "@hono/zod-openapi";
import { db } from "@orkide/db";
import { dailyStat } from "@orkide/db/schema";
import type { StatsOverview, TrackEvent } from "@orkide/validators/stats";
import { webVitalNames } from "@orkide/validators/stats";
import { env } from "cloudflare:workers";
import { sql } from "drizzle-orm";

import { DATASET, query, writeEvent } from "./analytics.ts";

const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview/iu;

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Anonymous visitor id: a hash of IP + user agent salted with a secret *and the current day*.
 * It counts unique visitors per day without cookies, and cannot be linked across days or reversed.
 */
const visitorHash = async (ip: string, userAgent: string, day: string) => {
  const input = new TextEncoder().encode(
    `${env.BETTER_AUTH_SECRET}:${day}:${ip}:${userAgent}`
  );
  return new Uint8Array(await crypto.subtle.digest("SHA-256", input))
    .toHex()
    .slice(0, 16);
};

export interface TrackContext {
  readonly ip: string;
  readonly userAgent: string;
  readonly country: string;
}

/** Records a beacon event. Returns `false` for known bots, which are never counted. */
export const track = async (
  event: TrackEvent,
  context: TrackContext
): Promise<boolean> => {
  if (BOT_USER_AGENT.test(context.userAgent)) {
    return false;
  }
  const visitor = await visitorHash(
    context.ip,
    context.userAgent,
    isoDay(new Date())
  );
  writeEvent(event, { country: context.country, visitor });
  return true;
};

const rollupRowSchema = z.object({
  path: z.string(),
  views: z.coerce.number(),
  visitors: z.coerce.number(),
});

/** D1 binds at most 100 parameters per statement, and each `daily_stat` row binds four. */
const ROWS_PER_STATEMENT = 25;
/**
 * The beacon accepts any path, so a day's distinct paths are unbounded; only the most viewed are
 * kept, which bounds the rollup's writes and the table's growth.
 */
const MAX_PATHS_PER_DAY = 1000;

/**
 * Cron: aggregates one UTC day of page views into `daily_stat`. Idempotent — re-running a day
 * overwrites its rows — so a missed or repeated cron run never double counts.
 */
export const rollup = async (day: string): Promise<number> => {
  const rows = await query(
    `SELECT blob2 AS path, SUM(_sample_interval) AS views, COUNT(DISTINCT blob6) AS visitors
     FROM ${DATASET}
     WHERE blob1 = 'pageview'
       AND timestamp >= toDateTime('${day} 00:00:00')
       AND timestamp < toDateTime('${day} 00:00:00') + INTERVAL '1' DAY
     GROUP BY path
     ORDER BY views DESC
     LIMIT ${MAX_PATHS_PER_DAY}`,
    rollupRowSchema
  );
  if (rows.length === 0) {
    return 0;
  }
  const values = rows.map((row) => ({ ...row, day }));
  const [first, ...rest] = Array.from(
    { length: Math.ceil(values.length / ROWS_PER_STATEMENT) },
    (_, index) =>
      db
        .insert(dailyStat)
        .values(
          values.slice(
            index * ROWS_PER_STATEMENT,
            (index + 1) * ROWS_PER_STATEMENT
          )
        )
        .onConflictDoUpdate({
          set: { views: sql`excluded.views`, visitors: sql`excluded.visitors` },
          target: [dailyStat.day, dailyStat.path],
        })
  );
  if (first) {
    await db.batch([first, ...rest]);
  }
  return rows.length;
};

/** Dashboard overview from the rollup table: totals, per-day series and top pages. */
export const overview = async (days: number): Promise<StatsOverview> => {
  const since = isoDay(new Date(Date.now() - days * 86_400_000));
  const where = sql`${dailyStat.day} >= ${since}`;
  const [daily, topPaths] = await Promise.all([
    db
      .select({
        day: dailyStat.day,
        views: sql<number>`sum(${dailyStat.views})`.mapWith(Number),
        visitors: sql<number>`sum(${dailyStat.visitors})`.mapWith(Number),
      })
      .from(dailyStat)
      .where(where)
      .groupBy(dailyStat.day)
      .orderBy(dailyStat.day),
    db
      .select({
        path: dailyStat.path,
        views: sql<number>`sum(${dailyStat.views})`.mapWith(Number),
      })
      .from(dailyStat)
      .where(where)
      .groupBy(dailyStat.path)
      .orderBy(sql`2 desc`)
      .limit(10),
  ]);
  return {
    daily,
    topPaths,
    totals: {
      views: daily.reduce((sum, row) => sum + row.views, 0),
      visitors: daily.reduce((sum, row) => sum + row.visitors, 0),
    },
  };
};

const vitalRowSchema = z.object({
  name: z.enum(webVitalNames),
  p75: z.coerce.number(),
  samples: z.coerce.number(),
});

/** 75th percentile of each Core Web Vital over the last `days` days (the CrUX convention). */
export const webVitals = (days: number) =>
  query(
    `SELECT blob3 AS name,
            quantileExactWeighted(0.75)(double1, _sample_interval) AS p75,
            SUM(_sample_interval) AS samples
     FROM ${DATASET}
     WHERE blob1 = 'vital' AND timestamp > NOW() - INTERVAL '${days}' DAY
     GROUP BY name`,
    vitalRowSchema
  );
