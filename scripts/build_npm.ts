import { build, emptyDir } from "@deno/dnt"

import denojson from "../deno.json" with { type: "json" }

await emptyDir("./npm")

await build({
  typeCheck: false,
  scriptModule: false,
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    deno: "dev",
  },
  package: {
    name: "@rotu/structview",
    version: `${denojson.version}+dnt`,
    repository: {
      type: "git",
      url: "https://github.com/rotu/structview",
    },
    description: "Read and write structured binary data with typesafe views",
    license: "MIT",
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("README.md", "npm/README.md")
  },
})
