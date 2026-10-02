import { z } from "@hono/zod-openapi";
import { idSchema } from "@orkide/validators/common";
import { env } from "cloudflare:workers";

/**
 * Every background job the Worker can run. The queue carries plain JSON, so each message is
 * validated against this union on the way out of the queue as well as on the way in.
 */
export const jobSchema = z.discriminatedUnion("type", [
  /** Email the site owner about a new contact message. */
  z.object({ messageId: idSchema, type: z.literal("contact.notify-owner") }),
]);

export type Job = z.infer<typeof jobSchema>;
export type JobType = Job["type"];
export type JobOf<T extends JobType> = Extract<Job, { type: T }>;

/** A job that must not be retried (bad input, permanently rejected by a provider). */
export class PermanentJobError extends Error {
  override readonly name = "PermanentJobError";
}

export const enqueue = async (...jobs: Job[]): Promise<void> => {
  if (jobs.length === 0) {
    return;
  }
  await env.JOBS.sendBatch(
    jobs.map((job) => ({ body: jobSchema.parse(job), contentType: "json" }))
  );
};
