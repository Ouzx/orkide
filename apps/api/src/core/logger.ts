import { consoleSink, createLogger } from "@orkide/logger";
import type { Level, LogSink } from "@orkide/logger";
import { env } from "cloudflare:workers";

const LEVELS = new Set<string>([
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);
const level = (LEVELS.has(env.LOG_LEVEL) ? env.LOG_LEVEL : "info") as Level;

/**
 * Pretty ANSI output in local development, structured JSON for Workers Logs everywhere else.
 * The pretty sink is loaded dynamically behind `import.meta.env.DEV` (statically replaced by Vite),
 * so `pino-pretty` is never part of a production bundle nor of the test runtime.
 */
const loadSink = async (): Promise<LogSink> => {
  if (import.meta.env.DEV && env.ENVIRONMENT === "development") {
    const { prettySink } = await import("@orkide/logger/pretty");
    return prettySink();
  }
  return consoleSink();
};

const sink = await loadSink();

/** Root logger for the API Worker. Handlers use the request-scoped child on `c.var.logger`. */
export const logger = createLogger({
  base: { environment: env.ENVIRONMENT },
  level,
  name: "api",
  sinks: [sink],
});
