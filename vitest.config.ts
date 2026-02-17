import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/integration/live-omnifocus.test.ts"],
    testTimeout: 10000,
  },
});
