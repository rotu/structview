#!/usr/bin/env node
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import packageJsonData from "#package-json" with { type: "json" }

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const [mode, commandArg] = process.argv.slice(2)

switch (mode) {
  case "dry-run":
    await runReleaseDryRun(resolveVersion(commandArg))
    break
  case "prepare":
    await prepareRelease(resolveVersion(commandArg))
    break
  case "publish-tag":
    await publishTaggedRelease(commandArg)
    break
  default:
    throw new Error(
      "Usage: scripts/release.ts <dry-run|prepare> [patch|minor|major|X.Y.Z]\n       scripts/release.ts <publish-tag> <vX.Y.Z>",
    )
}

function resolveVersion(input: string | undefined): string {
  const currentVersion = packageVersion()
  const requestedVersion = input?.trim() || "patch"

  if (/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(requestedVersion)) {
    return requestedVersion
  }

  return bumpVersion(currentVersion, requestedVersion)
}

async function runReleaseDryRun(version: string): Promise<void> {
  await rehearseRelease(version)

  console.log(`Dry run passed for v${version}`)
}

async function prepareRelease(version: string): Promise<void> {
  await rehearseRelease(version)
  await updateReleaseMetadata(version)

  console.log(`Prepared release ${releaseTag(version)}`)
  console.log(
    "Next step: review package.json, jsr.json, and package-lock.json, then commit and tag",
  )
}

async function rehearseRelease(version: string): Promise<void> {
  await ensureCleanWorktree()
  await ensureChangelogSection(version)
  await ensureTagDoesNotExist(version)

  const worktreePath = await mkdtemp(join(tmpdir(), "structview-release-"))

  try {
    await run("git", ["worktree", "add", "--detach", worktreePath, "HEAD"], { cwd: repoRoot })
    await run("vp", ["install", "--ignore-scripts"], { cwd: worktreePath })
    await run("npm", ["version", version, "--no-git-tag-version", "--allow-same-version"], {
      cwd: worktreePath,
    })
    await run("vp", ["run", "jsr:sync"], { cwd: worktreePath })
    await run("vp", ["run", "validate"], { cwd: worktreePath })
    await publishToNpm(version, {
      cwd: worktreePath,
      dryRun: true,
      provenance: false,
      skipExisting: false,
    })
  } finally {
    await run("git", ["worktree", "remove", "--force", worktreePath], { cwd: repoRoot }).catch(
      async () => {
        await rm(worktreePath, { recursive: true, force: true })
      },
    )
  }
}

async function updateReleaseMetadata(version: string): Promise<void> {
  await run("npm", ["version", version, "--no-git-tag-version", "--allow-same-version"], {
    cwd: repoRoot,
  })
  await run("vp", ["run", "jsr:sync"], { cwd: repoRoot })
}

async function publishTaggedRelease(tagName: string | undefined): Promise<void> {
  const version = verifyTag(tagName)

  await run("vp", ["run", "validate"], { cwd: repoRoot })
  await publishToNpm(version, {
    cwd: repoRoot,
    dryRun: false,
    provenance: true,
    skipExisting: true,
  })
  await publishToJsr(version, { cwd: repoRoot, skipExisting: true })

  console.log(`Published tagged release ${releaseTag(version)}`)
}

function npmPublishArgs(
  version: string,
  options: { dryRun: boolean; provenance: boolean },
): string[] {
  const args = ["publish"]

  if (options.provenance) {
    args.push("--provenance")
  }

  if (options.dryRun) {
    args.push("--dry-run")
  }

  const distTag = npmDistTag(version)
  if (distTag) {
    args.push("--tag", distTag)
  }

  return args
}

function npmDistTag(version: string): string | undefined {
  const prereleaseIdentifier = /^\d+\.\d+\.\d+-([0-9A-Za-z-]+)(?:\.[0-9A-Za-z-]+)*(?:\+.*)?$/.exec(
    version,
  )?.[1]

  if (!prereleaseIdentifier) {
    return undefined
  }

  if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(prereleaseIdentifier)) {
    throw new Error(`Cannot derive npm dist-tag from prerelease version: ${version}`)
  }

  return prereleaseIdentifier.toLowerCase()
}

async function publishToNpm(
  version: string,
  options: { cwd: string; dryRun: boolean; provenance: boolean; skipExisting: boolean },
): Promise<void> {
  if (options.skipExisting && (await npmVersionExists(version, options.cwd))) {
    console.log(`npm already has ${packageName()}@${version}; skipping npm publish`)
    return
  }

  await run("npm", npmPublishArgs(version, options), { cwd: options.cwd })
}

async function publishToJsr(
  version: string,
  options: { cwd: string; skipExisting: boolean },
): Promise<void> {
  if (options.skipExisting && (await jsrVersionExists(version))) {
    console.log(`JSR already has ${packageName()}@${version}; skipping JSR publish`)
    return
  }

  await run("jsr", ["publish"], { cwd: options.cwd })
}

function verifyTag(tagName: string | undefined): string {
  const version = packageVersion()
  const expectedTag = releaseTag(version)
  if (tagName !== expectedTag) {
    throw new Error(
      `Tag ${tagName ?? "<missing>"} does not match package.json version ${expectedTag}`,
    )
  }

  return version
}

async function ensureCleanWorktree(): Promise<void> {
  const status = await capture("git", ["status", "--short"], { cwd: repoRoot })
  if (status.trim() !== "") {
    throw new Error("Release commands require a clean git worktree")
  }
}

async function ensureChangelogSection(version: string): Promise<void> {
  const changelogText = await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8")
  if (!changelogText.includes(`## ${version}`)) {
    throw new Error(`CHANGELOG.md is missing a section for ${version}`)
  }
}

async function ensureTagDoesNotExist(version: string): Promise<void> {
  const tag = releaseTag(version)
  const localTag = await capture("git", ["tag", "--list", tag], { cwd: repoRoot })
  if (localTag.trim() !== "") {
    throw new Error(`Tag already exists locally: ${tag}`)
  }

  const remoteTag = await capture("git", ["ls-remote", "--tags", "origin", tag], { cwd: repoRoot })
  if (remoteTag.trim() !== "") {
    throw new Error(`Tag already exists on origin: ${tag}`)
  }
}

function bumpVersion(version: string, kind: string): string {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].+)?$/.exec(version)
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
      throw new Error(`Unsupported release type: ${kind}`)
  }
}

async function npmVersionExists(version: string, cwd: string): Promise<boolean> {
  return succeeds("npm", ["view", `${packageName()}@${version}`, "version"], { cwd })
}

async function jsrVersionExists(version: string): Promise<boolean> {
  const response = await fetch(new URL(`${packageName()}/meta.json`, "https://jsr.io/"))

  if (response.status === 404) {
    return false
  }

  if (!response.ok) {
    throw new Error(
      `Failed to query JSR package metadata: ${response.status} ${response.statusText}`,
    )
  }

  const packageMeta = (await response.json()) as { versions?: Record<string, unknown> }
  return Object.hasOwn(packageMeta.versions ?? {}, version)
}

function packageName(): string {
  return requiredString(packageJsonData.name, "package.json name")
}

function packageVersion(): string {
  return requiredString(packageJsonData.version, "package.json version")
}

function releaseTag(version: string): string {
  return `v${version}`
}

function requiredString(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Missing ${label}`)
  }

  return value
}

async function run(command: string, args: string[], options: { cwd: string }): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: "inherit",
    })

    child.on("error", rejectPromise)
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}`))
    })
  })
}

async function succeeds(
  command: string,
  args: string[],
  options: { cwd: string },
): Promise<boolean> {
  try {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        env: process.env,
        stdio: "ignore",
      })

      child.on("error", rejectPromise)
      child.on("exit", (code) => {
        if (code === 0) {
          resolvePromise()
          return
        }

        rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}`))
      })
    })

    return true
  } catch {
    return false
  }
}

async function capture(command: string, args: string[], options: { cwd: string }): Promise<string> {
  const chunks: string[] = []

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "inherit"],
    })

    child.stdout.setEncoding("utf8")
    child.stdout.on("data", (chunk: string) => {
      chunks.push(chunk)
    })
    child.on("error", rejectPromise)
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}`))
    })
  })

  return chunks.join("")
}
