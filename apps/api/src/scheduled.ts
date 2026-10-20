import { logger } from "./core/logger.ts";
import { publishDue as publishDuePosts } from "./modules/post/post.service.ts";
import { publishDue as publishDueProjects } from "./modules/project/project.service.ts";
import { isoDay, rollup } from "./modules/stats/stats.service.ts";

/**
 * The one cron expression, mirrored from `triggers.crons` in `wrangler.jsonc`. The Workers Free
 * plan allows five cron triggers per account, so every product built on Orkide uses a single one.
 */
export const CRON = "*/5 * * * *";

const yesterday = (now: Date) => isoDay(new Date(now.getTime() - 86_400_000));

/** The tick at 00:15 UTC also rolls yesterday's events into `daily_stat`. */
const rollsUp = (now: Date) =>
  now.getUTCHours() === 0 && now.getUTCMinutes() === 15;

/** Cron entry: publishes what has come due every five minutes, and rolls up the stats daily. */
export const scheduled: ExportedHandlerScheduledHandler<Env> = async (
  controller
) => {
  const now = new Date(controller.scheduledTime);
  const [posts, projects] = await Promise.all([
    publishDuePosts(now),
    publishDueProjects(now),
  ]);
  const stats = rollsUp(now)
    ? { day: yesterday(now), paths: await rollup(yesterday(now)) }
    : {};
  logger
    .child({ cron: controller.cron })
    .info({ posts, projects, ...stats }, "cron completed");
};
