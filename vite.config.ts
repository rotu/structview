import { defineConfig } from "vite-plus"

export default defineConfig({
  run: {
    tasks: {
      bench: {
        cache: false,
        command: "vitest bench --run",
      },
      build: {
        cache: false,
        command: "vp pack",
      },
      check: {
        command:
          "./scripts/sync-jsr-metadata.ts --check && vp fmt --check . && vp lint --type-aware",
      },
      "jsr:sync": {
        cache: false,
        command: "./scripts/sync-jsr-metadata.ts",
      },
      release: {
        cache: false,
        command: "./scripts/release.ts",
      },
      validate: {
        cache: false,
        command: "vp run check && vitest run && jsr publish --dry-run --allow-dirty",
      },
    },
  },
  staged: { "*": "vp check --fix" },
  pack: {
    entry: ["src/bigendian.ts", "src/mod.ts"],
    fixedExtension: false,
    root: "src",
    unbundle: true,
  },
})
