import { logger } from "./core/logger.ts";
import { publishDue as publishDuePosts } from "./modules/post/post.service.ts";
import { publishDue as publishDueProjects } from "./modules/project/project.service.ts";
import { rollup } from "./modules/stats/stats.service.ts";

/** Cron expressions, mirrored from `triggers.crons` in `wrangler.jsonc`. */
export const CRONS = {
  dailyRollup: "15 0 * * *",
  publishScheduled: "*/5 * * * *",
} as const;

const yesterday = (now: Date) =>
  new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);

const tasks: Record<string, (now: Date) => Promise<Record<string, unknown>>> = {
  [CRONS.dailyRollup]: async (now) => ({
    day: yesterday(now),
    paths: await rollup(yesterday(now)),
  }),
  [CRONS.publishScheduled]: async (now) => {
    const [posts, projects] = await Promise.all([
      publishDuePosts(now),
      publishDueProjects(now),
    ]);
    return { posts, projects };
  },
};

/** Cron entry: dispatches by expression; an unknown expression is a configuration error. */
export const scheduled: ExportedHandlerScheduledHandler<Env> = async (
  controller
) => {
  const task = tasks[controller.cron];
  const log = logger.child({ cron: controller.cron });
  if (!task) {
    log.error("no task registered for cron expression");
    return;
  }
  const result = await task(new Date(controller.scheduledTime));
  log.info(result, "cron completed");
};
