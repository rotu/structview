import process from "node:process"

const mode = process.argv[2]

if (!mode) {
  fail(
    "Usage: deno run -A scripts/pipeline.ts <validate-deno|test-runtime|release>",
  )
}

await main(mode)

async function main(currentMode: string): Promise<void> {
  switch (currentMode) {
    case "validate-deno":
      await run("deno", ["fmt", "--check"])
      await run("deno", ["lint"])
      await run("deno", ["test", "-A"])
      await run("deno", ["publish", "--dry-run"])
      await run("deno", ["run", "-A", "scripts/build_npm.ts"])
      return
    case "test-runtime":
      await runRuntimeTests()
      return
    case "release":
      await runRelease()
      return
    default:
      fail(`Unknown mode: ${currentMode}`)
  }
}

async function runRuntimeTests(): Promise<void> {
  const runtime = process.env.CI_RUNTIME
  if (!runtime) {
    fail("CI_RUNTIME must be set to node or bun")
  }

  const cwd = process.env.NPM_DIR ?? "./npm"

  if (runtime === "node") {
    await run("npm", ["install"], cwd)
    await run("npm", ["test"], cwd)
    return
  }

  if (runtime === "bun") {
    await run("bun", ["install"], cwd)
    await run("bun", ["run", "test_runner.js"], cwd)
    return
  }

  fail(`Unsupported CI_RUNTIME: ${runtime}`)
}

async function runRelease(): Promise<void> {
  const bump = process.env.RELEASE_BUMP ?? "patch"
  const explicitVersion = process.env.RELEASE_VERSION?.trim() ?? ""
  const publish = (process.env.RELEASE_PUBLISH ?? "true") === "true"
  const npmDir = process.env.NPM_DIR ?? "./npm"

  const currentVersion = await readDenoVersion()
  const nextVersion = explicitVersion || bumpVersion(currentVersion, bump)

  if (!isSemverCore(nextVersion)) {
    fail(`Version must be semver core X.Y.Z, got: ${nextVersion}`)
  }

  const tag = `v${nextVersion}`

  await ensureTagDoesNotExist(tag)
  const notes = await extractReleaseNotes(nextVersion)
  await writeDenoVersion(nextVersion)

  await run("deno", ["run", "-A", "scripts/build_npm.ts"])

  await run("git", ["config", "user.name", "github-actions[bot]"])
  await run("git", [
    "config",
    "user.email",
    "41898282+github-actions[bot]@users.noreply.github.com",
  ])
  await run("git", ["add", "deno.json"])

  const hasStagedChanges = await commandSucceeded("git", [
    "diff",
    "--cached",
    "--quiet",
  ])
  if (hasStagedChanges) {
    fail("No version changes to commit")
  }

  await run("git", ["commit", "-m", `chore(release): v${nextVersion}`])
  await run("git", ["tag", "-a", tag, "-m", `Release ${tag}`])
  await run("git", ["push", "origin", "HEAD"])
  await run("git", ["push", "origin", tag])

  await Deno.writeTextFile("release-notes.md", notes)
  await run("gh", [
    "release",
    "create",
    tag,
    "--notes-file",
    "release-notes.md",
  ])

  if (publish) {
    await run("deno", ["publish"])
    await run("npm", ["publish", "--provenance", "--access", "public"], npmDir)
    return
  }

  await run("deno", ["publish", "--dry-run"])
  await run("npm", [
    "publish",
    "--provenance",
    "--access",
    "public",
    "--dry-run",
  ], npmDir)
}

async function readDenoVersion(): Promise<string> {
  const config = JSON.parse(await Deno.readTextFile("deno.json"))
  const version = config.version
  if (typeof version !== "string" || version.length === 0) {
    fail("deno.json is missing a valid version")
  }
  return version
}

async function writeDenoVersion(version: string): Promise<void> {
  const config = JSON.parse(await Deno.readTextFile("deno.json"))
  config.version = version
  await Deno.writeTextFile("deno.json", `${JSON.stringify(config, null, 2)}\n`)
}

function bumpVersion(version: string, kind: string): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) {
    fail(`Cannot bump non-semver version: ${version}`)
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
      fail(`Unsupported bump type: ${kind}`)
  }
}

async function ensureTagDoesNotExist(tag: string): Promise<void> {
  await run("git", ["fetch", "--tags", "--force"])
  if (await commandSucceeded("git", ["rev-parse", "--verify", tag])) {
    fail(`Tag already exists: ${tag}`)
  }
}

async function extractReleaseNotes(version: string): Promise<string> {
  const changelog = await Deno.readTextFile("CHANGELOG.md")
  const lines = changelog.split(/\r?\n/)
  const header = `## ${version}`

  const start = lines.findIndex((line) => line.startsWith(header))
  if (start === -1) {
    fail(`CHANGELOG.md is missing a section for version ${version}`)
  }

  const collected: string[] = []
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.startsWith("## ")) {
      break
    }
    collected.push(line)
  }

  const notes = collected.join("\n").trim()
  if (!notes) {
    fail(`Changelog section for ${version} is empty`)
  }

  return notes + "\n"
}

function isSemverCore(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version)
}

async function commandSucceeded(
  command: string,
  args: string[],
  cwd?: string,
): Promise<boolean> {
  const proc = new Deno.Command(command, {
    args,
    cwd,
    stdin: "null",
    stdout: "null",
    stderr: "null",
  }).spawn()

  const status = await proc.status
  return status.success
}

async function run(
  command: string,
  args: string[],
  cwd?: string,
): Promise<void> {
  const proc = new Deno.Command(command, {
    args,
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }).spawn()

  const status = await proc.status
  if (!status.success) {
    fail(`${command} ${args.join(" ")} failed with exit code ${status.code}`)
  }
}

function fail(message: string): never {
  console.error(message)
  Deno.exit(1)
}
