import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["node_modules/**", "dist/**", "coverage/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      exclude: ["dist/**", "scripts/**", "tests/**"],
      thresholds: {
        statements: 80,
        branches: 60,
        functions: 80,
        lines: 80,
      },
    },
  },
});
