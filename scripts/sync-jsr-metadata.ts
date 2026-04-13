#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises"
import process from "node:process"
import packageJsonData from "#package-json" with { type: "json" }

const checkOnly = process.argv.includes("--check")
const jsrJsonPath = new URL("../jsr.json", import.meta.url)

const nextJsrJsonText = `${JSON.stringify(buildJsrJson(), null, 2)}\n`
const currentJsrJsonText = await readFile(jsrJsonPath, "utf8").catch((error: unknown) => {
  if (isMissingFileError(error)) {
    return ""
  }

  throw error
})

if (currentJsrJsonText === nextJsrJsonText) {
  console.log("package metadata ok")
} else if (checkOnly) {
  console.error("jsr.json is out of sync with package.json")
  process.exitCode = 1
} else {
  await writeFile(jsrJsonPath, nextJsrJsonText, "utf8")
  console.log("synced jsr.json from package.json")
}

function buildJsrJson() {
  return {
    name: packageJsonData.name ?? null,
    version: packageJsonData.version ?? null,
    license: packageJsonData.license ?? null,
    exports: Object.fromEntries(
      Object.entries(packageJsonData.exports ?? {})
        .filter(([subpath]) => subpath !== "./package.json")
        .map(([subpath, target]) => [subpath, resolveExportTarget(target)]),
    ),
    publish: { include: ["jsr.json", ...(packageJsonData.files ?? [])] },
  }
}

function isMissingFileError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

function resolveExportTarget(target: unknown) {
  if (typeof target === "string") {
    return target
  }

  if (!target || typeof target !== "object") {
    return null
  }

  const {
    jsr,
    deno,
    default: defaultTarget,
  } = target as {
    jsr?: string
    deno?: string
    default?: string
  }

  return jsr ?? deno ?? defaultTarget ?? null
}
