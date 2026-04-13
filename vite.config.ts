import { fileURLToPath } from "node:url"
import { defineConfig } from "vite-plus"
export default defineConfig({
  run: {
    tasks: {
      bench: {
        cache: false,
        command: "vp test bench --run",
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
        command: "vp run check && vp test run && jsr publish --dry-run --allow-dirty",
      },
    },
  },
  resolve: {
    alias: {
      "@rotu/structview": fileURLToPath(new URL("./src/mod.ts", import.meta.url)),
      "@rotu/structview/bigendian": fileURLToPath(new URL("./src/bigendian.ts", import.meta.url)),
    },
  },
  staged: { "*": "vp check --fix" },
  fmt: {
    ignorePatterns: ["dist", "jsr.json", "node_modules"],
    semi: false,
    sortPackageJson: true,
    jsdoc: true,
    proseWrap: "never",
  },
  lint: {
    ignorePatterns: ["dist", "node_modules"],
    options: {
      typeAware: true,
      typeCheck: true,
      denyWarnings: true,
      reportUnusedDisableDirectives: "error",
    },
    rules: { "import/no-relative-parent-imports": "warn" },
    plugins: ["typescript", "unicorn", "oxc", "import"],
    overrides: [
      {
        files: ["tests"],
        env: { node: true },
        plugins: ["typescript", "unicorn", "oxc", "import", "vitest"],
      },
      { files: ["scripts/**/*.ts"], env: { node: true } },
    ],
  },
  pack: {
    entry: ["src/bigendian.ts", "src/mod.ts"],
    fixedExtension: false,
    root: "src",
    unbundle: true,
  },
})
