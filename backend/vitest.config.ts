import { defineConfig } from "vitest/config";
import tsconfig from "./tsconfig.json" with { type: "json" };

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.invariant.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 10_000,
    env: { NODE_ENV: "test", AUTH_SSO_ENABLED: "false" },
    globalSetup: "./scripts/test-db-global-setup.ts",
  },
  resolve: {
    extensions: [".ts"],
  },
  esbuild: {
    target: (tsconfig as { compilerOptions?: { target?: string } }).compilerOptions?.target ?? "ES2022",
  },
});
