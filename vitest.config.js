import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    setupFiles: ["./tests/setup.js"],
    // Tests share an in-memory Mongo via mongoose's default connection, so run
    // files serially to keep the database state deterministic.
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 30000,
  },
});
