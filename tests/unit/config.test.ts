import { describe, it, expect } from "vitest";
import { config } from "../../src/config.js";

describe("config", () => {
  it("should have a positive executor timeout", () => {
    expect(config.executorTimeout).toBeGreaterThan(0);
  });

  it("should have a positive maxBuffer", () => {
    expect(config.maxBuffer).toBeGreaterThan(0);
  });

  it("should have cache TTLs for all domains", () => {
    const domains = ["tasks", "projects", "folders", "tags", "database", "perspectives"] as const;
    for (const domain of domains) {
      expect(config.cacheTTL[domain]).toBeGreaterThan(0);
    }
  });

  it("should have a reasonable default limit", () => {
    expect(config.defaultLimit).toBeGreaterThan(0);
    expect(config.defaultLimit).toBeLessThanOrEqual(config.maxLimit);
  });

  it("should have maxLimit >= defaultLimit", () => {
    expect(config.maxLimit).toBeGreaterThanOrEqual(config.defaultLimit);
  });

  it("should have executor timeout in a reasonable range (1s - 5min)", () => {
    expect(config.executorTimeout).toBeGreaterThanOrEqual(1000);
    expect(config.executorTimeout).toBeLessThanOrEqual(300_000);
  });
});
