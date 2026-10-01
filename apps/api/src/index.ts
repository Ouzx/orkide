import { app } from "./app.ts";
import { queue } from "./queue.ts";
import { scheduled } from "./scheduled.ts";

export { LiveVisitors } from "./modules/live/live-visitors.ts";

/** Worker entry: HTTP through Hono, background jobs through the queue, maintenance through cron. */
export default {
  fetch: app.fetch,
  queue,
  scheduled,
} satisfies ExportedHandler<Env>;
