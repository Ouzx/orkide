import { app } from "./app.ts";

export { LiveVisitors } from "./modules/live/live-visitors.ts";

/** Worker entry: HTTP via Hono; queue consumer and cron handlers are added by their modules. */
export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
