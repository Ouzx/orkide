import type { Level } from "pino";
import { prettyFactory } from "pino-pretty";

import type { LogSink } from "./index.ts";

/**
 * Human-readable ANSI output for local development.
 *
 * Kept in its own entry point so production bundles never include `pino-pretty`:
 * import it behind `import.meta.env.DEV` and the bundler drops it from release builds.
 */
export const prettySink = (level?: Level): LogSink => {
  const format = prettyFactory({
    colorize: true,
    ignore: "pid,hostname,severity",
    messageKey: "message",
    singleLine: false,
    translateTime: "SYS:HH:MM:ss.l",
  });

  return {
    level,
    write(line) {
      // oxlint-disable-next-line no-console -- development-only terminal output.
      console.log(format(line).trimEnd());
    },
  };
};
