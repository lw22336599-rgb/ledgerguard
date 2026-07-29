import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,mjs}"],
    exclude: ["dist/**", "node_modules/**"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts"],
    },
  },
});
