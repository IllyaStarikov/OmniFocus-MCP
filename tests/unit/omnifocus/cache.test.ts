import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Cache } from "../../../src/omnifocus/cache.js";

describe("Cache", () => {
  let cache: Cache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new Cache();
  });

  afterEach(() => {
    cache.destroy();
    vi.useRealTimers();
  });

  it("should store and retrieve values", () => {
    cache.set("key1", "value1", 5000);
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return undefined for missing keys", () => {
    expect(cache.get("missing")).toBeUndefined();
  });

  it("should return undefined for expired entries", () => {
    cache.set("key1", "value1", 5000);
    vi.advanceTimersByTime(5001);
    expect(cache.get("key1")).toBeUndefined();
  });

  it("should return value before expiry", () => {
    cache.set("key1", "value1", 5000);
    vi.advanceTimersByTime(4999);
    expect(cache.get("key1")).toBe("value1");
  });

  it("should invalidate by prefix", () => {
    cache.set("tasks:list", [1, 2], 5000);
    cache.set("tasks:get:abc", { id: "abc" }, 5000);
    cache.set("projects:list", [3, 4], 5000);

    cache.invalidatePrefix("tasks:");

    expect(cache.get("tasks:list")).toBeUndefined();
    expect(cache.get("tasks:get:abc")).toBeUndefined();
    expect(cache.get("projects:list")).toEqual([3, 4]);
  });

  it("should invalidate all entries", () => {
    cache.set("a", 1, 5000);
    cache.set("b", 2, 5000);
    cache.invalidateAll();
    expect(cache.size).toBe(0);
  });

  it("should overwrite existing entries", () => {
    cache.set("key1", "old", 5000);
    cache.set("key1", "new", 5000);
    expect(cache.get("key1")).toBe("new");
  });

  it("should handle complex objects", () => {
    const obj = { id: "123", items: [1, 2, 3], nested: { deep: true } };
    cache.set("complex", obj, 5000);
    expect(cache.get("complex")).toEqual(obj);
  });

  it("should track size correctly", () => {
    expect(cache.size).toBe(0);
    cache.set("a", 1, 5000);
    cache.set("b", 2, 5000);
    expect(cache.size).toBe(2);
    cache.invalidatePrefix("a");
    expect(cache.size).toBe(1);
  });
});
