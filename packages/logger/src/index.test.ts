import { describe, expect, it, vi } from "vitest";

import { consoleSink, createLogger } from "./index.ts";
import type { LogSink } from "./index.ts";

const memorySink = (level?: LogSink["level"]) => {
  const lines: Record<string, unknown>[] = [];
  const sink: LogSink = {
    level,
    write: (line) => lines.push(JSON.parse(line) as Record<string, unknown>),
  };
  return { lines, sink };
};

describe(createLogger, () => {
  it("emits structured JSON with service, severity and message", () => {
    const { lines, sink } = memorySink();
    createLogger({ name: "api", sinks: [sink] }).info(
      { route: "/posts" },
      "listed"
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: 30,
      message: "listed",
      route: "/posts",
      service: "api",
      severity: "info",
    });
  });

  it("redacts secrets at default and custom paths", () => {
    const { lines, sink } = memorySink();
    const logger = createLogger({
      name: "api",
      redact: ["user.email"],
      sinks: [sink],
    });

    logger.info({
      headers: { authorization: "Bearer abc", cookie: "session=1" },
      password: "hunter2",
      user: { email: "a@b.c", id: "u1" },
    });

    expect(lines[0]).toMatchObject({
      headers: { authorization: "[redacted]", cookie: "[redacted]" },
      password: "[redacted]",
      user: { email: "[redacted]", id: "u1" },
    });
  });

  it("fans out to every sink respecting per-sink levels", () => {
    const all = memorySink("debug");
    const errorsOnly = memorySink("error");
    const logger = createLogger({
      level: "debug",
      name: "api",
      sinks: [all.sink, errorsOnly.sink],
    });

    logger.debug("noise");
    logger.error("boom");

    expect(all.lines.map((line) => line.message)).toStrictEqual([
      "noise",
      "boom",
    ]);
    expect(errorsOnly.lines.map((line) => line.message)).toStrictEqual([
      "boom",
    ]);
  });

  it("binds request context through child loggers", () => {
    const { lines, sink } = memorySink();
    createLogger({ name: "api", sinks: [sink] })
      .child({ requestId: "r-1" })
      .warn("slow");

    expect(lines[0]).toMatchObject({
      message: "slow",
      requestId: "r-1",
      severity: "warn",
    });
  });
});

describe(consoleSink, () => {
  it("routes lines to the console method matching their level", () => {
    const error = vi.spyOn(console, "error").mockReturnValue();
    createLogger({ name: "api", sinks: [consoleSink()] }).error("failed");

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ message: "failed" })
    );
    error.mockRestore();
  });
});
