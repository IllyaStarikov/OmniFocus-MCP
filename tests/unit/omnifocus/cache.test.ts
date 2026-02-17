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

  it("should evict oldest entry when at maxSize", () => {
    const smallCache = new Cache(3);
    smallCache.set("a", 1, 5000);
    smallCache.set("b", 2, 5000);
    smallCache.set("c", 3, 5000);
    expect(smallCache.size).toBe(3);

    // Adding a 4th entry should evict "a" (FIFO)
    smallCache.set("d", 4, 5000);
    expect(smallCache.size).toBe(3);
    expect(smallCache.get("a")).toBeUndefined();
    expect(smallCache.get("b")).toBe(2);
    expect(smallCache.get("d")).toBe(4);
    smallCache.destroy();
  });

  it("should not evict when overwriting existing key at maxSize", () => {
    const smallCache = new Cache(2);
    smallCache.set("a", 1, 5000);
    smallCache.set("b", 2, 5000);

    // Overwriting "a" should not evict anything
    smallCache.set("a", 10, 5000);
    expect(smallCache.size).toBe(2);
    expect(smallCache.get("a")).toBe(10);
    expect(smallCache.get("b")).toBe(2);
    smallCache.destroy();
  });

  it("should handle prefix invalidation with no matches", () => {
    cache.set("tasks:list", [1], 5000);
    cache.set("tasks:get", [2], 5000);

    cache.invalidatePrefix("projects:");
    expect(cache.size).toBe(2);
    expect(cache.get("tasks:list")).toEqual([1]);
  });

  it("should be safe to call destroy() twice", () => {
    cache.set("a", 1, 5000);
    cache.destroy();
    expect(() => cache.destroy()).not.toThrow();
    expect(cache.size).toBe(0);
  });

  it("should sweep expired entries periodically", () => {
    cache.set("short", "val", 1000);
    cache.set("long", "val", 600_000);

    // Advance past short TTL but before sweep interval
    vi.advanceTimersByTime(2000);

    // get() on expired key should clean it up
    expect(cache.get("short")).toBeUndefined();
    expect(cache.get("long")).toBe("val");

    // Advance to trigger sweep interval (5 minutes)
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(cache.get("long")).toBe("val");
  });
});
