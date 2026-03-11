import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgres://draftmark:draftmark@localhost:5435/draftmark_test",
      TEST_BASE_URL: process.env.TEST_BASE_URL || "http://localhost:3333",
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/__tests__/lib/**/*.test.ts"],
        },
        resolve: {
          alias: { "@": path.resolve(__dirname, "./src") },
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/__tests__/api/**/*.test.ts"],
          setupFiles: ["./src/__tests__/setup.ts"],
          fileParallelism: false,
        },
        resolve: {
          alias: { "@": path.resolve(__dirname, "./src") },
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
