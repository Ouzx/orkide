import { z } from "@hono/zod-openapi";
import type { TrackEvent } from "@orkide/validators/stats";
import { env } from "cloudflare:workers";

/**
 * Analytics Engine data point layout. Analytics Engine stores positional columns, so this module
 * is the only place that knows which blob/double holds what.
 *
 * | column  | pageview          | vital        |
 * |---------|-------------------|--------------|
 * | blob1   | "pageview"        | "vital"      |
 * | blob2   | path              | path         |
 * | blob3   | locale            | metric name  |
 * | blob4   | referrer host     | rating       |
 * | blob5   | country           | country      |
 * | blob6   | visitor hash      | visitor hash |
 * | double1 | 1                 | metric value |
 * | index1  | path (sampling key)              |
 */
export const DATASET = "orkide_events";

export interface EventContext {
  readonly country: string;
  readonly visitor: string;
}

const referrerHost = (referrer: string | undefined): string => {
  if (!referrer) {
    return "";
  }
  return URL.parse(referrer)?.hostname ?? "";
};

export const writeEvent = (
  event: TrackEvent,
  { country, visitor }: EventContext
): void => {
  const isPageview = event.type === "pageview";
  env.ANALYTICS.writeDataPoint({
    blobs: [
      event.type,
      event.path,
      isPageview ? event.locale : event.name,
      isPageview ? referrerHost(event.referrer) : event.rating,
      country,
      visitor,
    ],
    doubles: [isPageview ? 1 : event.value],
    indexes: [event.path],
  });
};

const sqlResponseSchema = <T extends z.ZodType>(row: T) =>
  z.object({ data: z.array(row) });

/**
 * Runs a query against the Analytics Engine SQL API. Counts must use `SUM(_sample_interval)`:
 * Analytics Engine samples at high volume and records how many events each row represents.
 */
export const query = async <T extends z.ZodType>(
  sql: string,
  row: T
): Promise<z.infer<T>[]> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`,
    {
      body: `${sql} FORMAT JSON`,
      headers: { authorization: `Bearer ${env.ANALYTICS_API_TOKEN}` },
      method: "POST",
    }
  );
  if (!response.ok) {
    throw new Error(
      `Analytics Engine SQL API responded ${response.status}: ${await response.text()}`
    );
  }
  return sqlResponseSchema(row).parse(await response.json()).data;
};
