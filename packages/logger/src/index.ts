import pino from "pino";
import type { DestinationStream, Level, Logger, LoggerOptions } from "pino";

export type { Level, Logger } from "pino";

/**
 * A sink receives every serialized log line at or above its level.
 * Sinks are synchronous: Workers have no `worker_threads`, so Pino transports are unavailable.
 */
export interface LogSink {
  readonly level?: Level;
  readonly write: (line: string) => void;
}

export interface CreateLoggerOptions {
  /** Logical service name, attached to every line as `service`. */
  readonly name: string;
  /** Minimum level emitted by the logger. Defaults to `info`. */
  readonly level?: Level;
  /** Static bindings merged into every line (e.g. `version`, `environment`). */
  readonly base?: Readonly<Record<string, unknown>>;
  /** Extra redaction paths on top of {@link DEFAULT_REDACT_PATHS}. */
  readonly redact?: readonly string[];
  /** Output targets. Defaults to a single {@link consoleSink}. */
  readonly sinks?: readonly LogSink[];
}

/** Paths whose values are always replaced with `[redacted]`. */
export const DEFAULT_REDACT_PATHS = [
  "password",
  "token",
  "secret",
  "*.password",
  "*.token",
  "*.secret",
  "headers.authorization",
  "headers.cookie",
  "*.headers.authorization",
  "*.headers.cookie",
] as const;

const CONSOLE_METHOD_BY_LEVEL: Readonly<
  Record<number, "debug" | "info" | "warn" | "error">
> = {
  10: "debug",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "error",
};

const levelOf = (line: string): number => {
  const match = /"level":(?<level>\d+)/u.exec(line);
  const level = match?.groups?.level;
  return level === undefined ? 30 : Number(level);
};

/**
 * Writes structured JSON through `console`, which Workers Logs and Logpush index as fields.
 * Lines are re-parsed into objects so the dashboard can filter on every key, and routed to the
 * console method that matches their severity.
 */
export const consoleSink = (level?: Level): LogSink => ({
  level,
  write(line) {
    const method = CONSOLE_METHOD_BY_LEVEL[levelOf(line)] ?? "info";
    // oxlint-disable-next-line no-console -- this sink is the one sanctioned console boundary.
    console[method](JSON.parse(line));
  },
});

const toDestination = (sink: LogSink): DestinationStream => ({
  write: (line: string) => sink.write(line),
});

/** Creates the root logger. Create it once per Worker and derive request loggers with `child`. */
export const createLogger = ({
  name,
  level = "info",
  base,
  redact = [],
  sinks = [consoleSink()],
}: CreateLoggerOptions): Logger => {
  const options: LoggerOptions = {
    base: { service: name, ...base },
    formatters: {
      level: (label, value) => ({ level: value, severity: label }),
    },
    level,
    messageKey: "message",
    redact: {
      censor: "[redacted]",
      paths: [...DEFAULT_REDACT_PATHS, ...redact],
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  const [single, ...rest] = sinks;
  if (single !== undefined && rest.length === 0 && single.level === undefined) {
    return pino(options, toDestination(single));
  }

  return pino(
    options,
    pino.multistream(
      sinks.map((sink) => ({
        level: sink.level ?? level,
        stream: toDestination(sink),
      }))
    )
  );
};
