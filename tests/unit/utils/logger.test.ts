import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let stderrSpy: any;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    vi.resetModules();
  });

  it("should log at info level by default", async () => {
    delete process.env.LOG_LEVEL;
    const { logger } = await import("../../../src/utils/logger.js");
    logger.info("test message");
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse((stderrSpy.mock.calls[0][0] as string).trim());
    expect(output.level).toBe("info");
    expect(output.message).toBe("test message");
    expect(output.timestamp).toBeDefined();
  });

  it("should not log debug when level is info", async () => {
    process.env.LOG_LEVEL = "info";
    const { logger } = await import("../../../src/utils/logger.js");
    logger.debug("debug message");
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("should log debug when level is debug", async () => {
    process.env.LOG_LEVEL = "debug";
    const { logger } = await import("../../../src/utils/logger.js");
    logger.debug("debug message");
    expect(stderrSpy).toHaveBeenCalledTimes(1);
  });

  it("should log warn and error at info level", async () => {
    process.env.LOG_LEVEL = "info";
    const { logger } = await import("../../../src/utils/logger.js");
    logger.warn("warning");
    logger.error("error");
    expect(stderrSpy).toHaveBeenCalledTimes(2);
  });

  it("should fall back to info for invalid LOG_LEVEL", async () => {
    process.env.LOG_LEVEL = "verbose";
    const { logger } = await import("../../../src/utils/logger.js");
    // With invalid level, should default to "info" — info should log, debug should not
    logger.info("info msg");
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    logger.debug("debug msg");
    expect(stderrSpy).toHaveBeenCalledTimes(1); // still 1 — debug was suppressed
  });

  it("should include extra data fields in log output", async () => {
    delete process.env.LOG_LEVEL;
    const { logger } = await import("../../../src/utils/logger.js");
    logger.info("with data", { tool: "list_tasks", duration: 123 });
    const output = JSON.parse((stderrSpy.mock.calls[0][0] as string).trim());
    expect(output.tool).toBe("list_tasks");
    expect(output.duration).toBe(123);
  });

  it("should only log error level when LOG_LEVEL is error", async () => {
    process.env.LOG_LEVEL = "error";
    const { logger } = await import("../../../src/utils/logger.js");
    logger.info("nope");
    logger.warn("nope");
    expect(stderrSpy).not.toHaveBeenCalled();
    logger.error("yes");
    expect(stderrSpy).toHaveBeenCalledTimes(1);
  });
});
