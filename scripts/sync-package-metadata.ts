import { readFile, writeFile } from "node:fs/promises"
import process from "node:process"
import denoJsonData from "../deno.json" with { type: "json" }
import packageJsonData from "../package.json" with { type: "json" }

interface PackageConditionalExport {
  deno?: string
  default?: string
  [key: string]: unknown
}

type PackageExportTarget = string | PackageConditionalExport
type PackageExportMap = Record<string, PackageExportTarget>
type DenoExportMap = Record<string, string>

interface PackageJson {
  name?: string
  version?: string
  license?: string
  exports?: PackageExportMap
  files?: string[]
}

interface DenoJson {
  name?: string
  version?: string
  license?: string
  exports?: DenoExportMap
  publish?: {
    include?: string[]
    exclude?: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

const checkOnly = process.argv.includes("--check")
const denoJsonPath = new URL("../deno.json", import.meta.url)

await main()

async function main(): Promise<void> {
  const packageJson = packageJsonData as PackageJson
  const denoJson = denoJsonData as DenoJson
  const denoJsonText = await readFile(denoJsonPath, "utf8")

  const nextDenoJson: DenoJson = {
    ...denoJson,
    name: requireString(packageJson.name, "package.json name"),
    version: requireString(packageJson.version, "package.json version"),
    license: requireString(packageJson.license, "package.json license"),
    exports: deriveDenoExports(packageJson.exports),
    publish: {
      ...denoJson.publish,
      include: derivePublishInclude(packageJson.files),
    },
  }

  if (nextDenoJson.publish) {
    delete nextDenoJson.publish.exclude
  }

  const nextDenoJsonText = `${JSON.stringify(nextDenoJson, null, 2)}\n`

  if (denoJsonText === nextDenoJsonText) {
    console.log("package metadata ok")
    return
  }

  if (checkOnly) {
    console.error("deno.json is out of sync with package.json")
    process.exitCode = 1
    return
  }

  await writeFile(denoJsonPath, nextDenoJsonText, "utf8")
  console.log("synced deno.json from package.json")
}

function requireString(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Missing ${label}`)
  }

  return value
}

function deriveDenoExports(
  packageExports: PackageExportMap | undefined,
): DenoExportMap {
  if (!packageExports) {
    throw new Error("package.json must define an exports object")
  }

  const denoExports = Object.fromEntries(
    Object.entries(packageExports).filter(([subpath]) => {
      return subpath !== "./package.json"
    }).map(([subpath, target]) => {
      if (typeof target === "string") {
        return [subpath, target]
      }

      if (typeof target.deno === "string") {
        return [subpath, target.deno]
      }

      if (typeof target.default !== "string") {
        throw new Error(
          `package.json export ${subpath} must provide a string deno or default target`,
        )
      }

      return [subpath, target.default]
    }),
  )

  if (Object.keys(denoExports).length === 0) {
    throw new Error(
      "package.json exports must include at least one TypeScript entrypoint",
    )
  }

  return denoExports
}

function derivePublishInclude(packageFiles: string[] | undefined): string[] {
  if (!Array.isArray(packageFiles) || packageFiles.length === 0) {
    throw new Error("package.json must define a non-empty files array")
  }

  return ["deno.json", ...packageFiles]
}
