import { cloudflareTest } from "@cloudflare/vitest-pool-workers"
import { defineConfig, mergeConfig } from "vitest/config"
import baseConfig from "./vite.config.ts"

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [
      cloudflareTest({
        wrangler: {
          configPath: "./tests/workers/wrangler.jsonc",
        },
      }),
    ],
    test: {
      include: ["tests/**/*.test.ts", "tests/**/*.workers.ts"],
    },
  }),
)
