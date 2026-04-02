import { readFile, writeFile } from "node:fs/promises"
import process from "node:process"
import packageJsonData from "../package.json" with { type: "json" }

const mode = process.argv[2]

switch (mode) {
  case "resolve":
    resolveReleaseVersion()
    break
  case "notes":
    await writeReleaseNotes()
    break
  default:
    throw new Error(
      "Usage: deno run -A scripts/release-helper.ts <resolve|notes>",
    )
}

function resolveReleaseVersion(): void {
  const currentVersion = readPackageVersion()
  const explicitVersion = process.env.RELEASE_VERSION?.trim() ?? ""
  const bump = process.env.RELEASE_BUMP ?? "patch"
  const nextVersion = explicitVersion || bumpVersion(currentVersion, bump)

  if (!/^\d+\.\d+\.\d+$/.test(nextVersion)) {
    throw new Error(`Version must be semver core X.Y.Z, got: ${nextVersion}`)
  }

  console.log(`version=${nextVersion}`)
  console.log(`tag=v${nextVersion}`)
}

async function writeReleaseNotes(): Promise<void> {
  const version = requireEnv("RELEASE_VERSION")
  const outputFile = requireEnv("RELEASE_NOTES_FILE")
  const changelogPath = new URL("../CHANGELOG.md", import.meta.url)
  const lines = (await readFile(changelogPath, "utf8")).split(/\r?\n/)
  const header = `## ${version}`
  const start = lines.findIndex((line) => line.startsWith(header))

  if (start === -1) {
    throw new Error(`CHANGELOG.md is missing a section for version ${version}`)
  }

  const collected: string[] = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.startsWith("## ")) {
      break
    }
    collected.push(line)
  }

  const notes = collected.join("\n").trim()
  if (!notes) {
    throw new Error(`Changelog section for ${version} is empty`)
  }

  await writeFile(outputFile, `${notes}\n`, "utf8")
}

function bumpVersion(version: string, kind: string): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) {
    throw new Error(`Cannot bump non-semver version: ${version}`)
  }

  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])

  switch (kind) {
    case "major":
      return `${major + 1}.0.0`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "patch":
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Unsupported bump type: ${kind}`)
  }
}

function readPackageVersion(): string {
  const packageJson = packageJsonData as {
    version?: string
  }
  return requireValue(packageJson.version, "package.json version")
}

function requireEnv(name: string): string {
  return requireValue(process.env[name], name)
}

function requireValue(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Missing ${label}`)
  }

  return value
}
