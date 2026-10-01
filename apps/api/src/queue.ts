import { jobSchema, PermanentJobError } from "./core/jobs.ts";
import type { JobOf, JobType } from "./core/jobs.ts";
import { logger } from "./core/logger.ts";
import {
  acknowledgeSender,
  notifyOwner,
} from "./modules/contact/contact.service.ts";

/** Maps every job type to the module function that performs it. Exhaustive by construction. */
const handlers: { readonly [T in JobType]: (job: JobOf<T>) => Promise<void> } =
  {
    "contact.acknowledge-sender": acknowledgeSender,
    "contact.notify-owner": notifyOwner,
  };

const run = <T extends JobType>(job: JobOf<T>) =>
  (handlers[job.type] as (job: JobOf<T>) => Promise<void>)(job);

/** Exponential backoff capped at one hour: 30s, 60s, 120s, … */
const backoffSeconds = (attempts: number) =>
  Math.min(3600, 30 * 2 ** Math.max(0, attempts - 1));

/**
 * Queue consumer. Messages are acknowledged individually, so one failure never re-runs the
 * rest of the batch. Invalid or permanently failing jobs are acknowledged and logged; everything
 * else is retried with backoff and lands in the dead-letter queue after `max_retries`.
 */
export const queue: ExportedHandlerQueueHandler<Env, unknown> = async (
  batch
) => {
  await Promise.all(
    batch.messages.map(async (message) => {
      const log = logger.child({
        attempts: message.attempts,
        jobId: message.id,
        queue: batch.queue,
      });
      const parsed = jobSchema.safeParse(message.body);
      if (!parsed.success) {
        log.error({ issues: parsed.error.issues }, "discarding malformed job");
        message.ack();
        return;
      }
      try {
        await run(parsed.data);
        log.info({ type: parsed.data.type }, "job completed");
        message.ack();
      } catch (error) {
        if (error instanceof PermanentJobError) {
          log.error(
            { err: error, type: parsed.data.type },
            "job failed permanently"
          );
          message.ack();
          return;
        }
        log.warn(
          { err: error, type: parsed.data.type },
          "job failed, retrying"
        );
        message.retry({ delaySeconds: backoffSeconds(message.attempts) });
      }
    })
  );
};
