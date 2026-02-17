import { describe, it, expect } from "vitest";
import {
  OmniFocusError,
  NotRunningError,
  PermissionError,
  NotFoundError,
  TimeoutError,
  ScriptError,
  parseExecutorError,
  formatMcpError,
} from "../../../src/utils/errors.js";

describe("parseExecutorError", () => {
  it("should return NotRunningError for -600 error", () => {
    const err = parseExecutorError("execution error: Application is not running (-600)", 1);
    expect(err).toBeInstanceOf(NotRunningError);
  });

  it("should return NotRunningError for connection invalid", () => {
    const err = parseExecutorError("connection is invalid", 1);
    expect(err).toBeInstanceOf(NotRunningError);
  });

  it("should return PermissionError for -1743 error", () => {
    const err = parseExecutorError("Not authorized to send Apple events (-1743)", 1);
    expect(err).toBeInstanceOf(PermissionError);
  });

  it("should return PermissionError for not permitted", () => {
    const err = parseExecutorError("Operation not permitted", 1);
    expect(err).toBeInstanceOf(PermissionError);
  });

  it("should return TimeoutError for null exit code (killed)", () => {
    const err = parseExecutorError("", null);
    expect(err).toBeInstanceOf(TimeoutError);
  });

  it("should return TimeoutError for timeout messages", () => {
    const err = parseExecutorError("timed out waiting for reply", 1);
    expect(err).toBeInstanceOf(TimeoutError);
  });

  it("should return ScriptError for generic errors", () => {
    const err = parseExecutorError("ReferenceError: x is not defined", 1);
    expect(err).toBeInstanceOf(ScriptError);
    expect(err.message).toBe("ReferenceError: x is not defined");
  });

  it("should include exit code when stderr is empty", () => {
    const err = parseExecutorError("", 42);
    expect(err).toBeInstanceOf(ScriptError);
    expect(err.message).toContain("42");
  });
});

describe("formatMcpError", () => {
  it("should format NotRunningError as retryable", () => {
    const result = formatMcpError(new NotRunningError());
    expect(result.isRetryable).toBe(true);
    expect(result.message).toContain("running");
  });

  it("should format PermissionError as non-retryable", () => {
    const result = formatMcpError(new PermissionError());
    expect(result.isRetryable).toBe(false);
    expect(result.message).toContain("permission");
  });

  it("should format TimeoutError as retryable", () => {
    const result = formatMcpError(new TimeoutError());
    expect(result.isRetryable).toBe(true);
  });

  it("should format NotFoundError as non-retryable", () => {
    const result = formatMcpError(new NotFoundError("Task not found"));
    expect(result.isRetryable).toBe(false);
    expect(result.message).toContain("Task not found");
  });

  it("should format generic Error", () => {
    const result = formatMcpError(new Error("oops"));
    expect(result.message).toContain("oops");
    expect(result.isRetryable).toBe(false);
  });

  it("should format non-Error values", () => {
    const result = formatMcpError("some string");
    expect(result.message).toContain("some string");
  });

  it("should preserve error hierarchy", () => {
    const err = new NotRunningError();
    expect(err).toBeInstanceOf(NotRunningError);
    expect(err).toBeInstanceOf(OmniFocusError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("NOT_RUNNING");
  });
});
