/**
 * @file Verifies the packed npm artifact after installation from node_modules.
 * Source-level tests cover workspace modules directly, but this catches export,
 * prepack, and package-contents regressions that only appear in the published layout.
 */

import { execFile } from "node:child_process"
import { mkdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const workspaceDir = await mkdirTemp()
const installPrefix = join(workspaceDir, "project")
const npmCacheDir = join(workspaceDir, "npm-cache")

try {
  await mkdir(installPrefix, { recursive: true })
  await mkdir(npmCacheDir, { recursive: true })
  const tarballPath = await packTarball(workspaceDir)
  await installTarball(installPrefix, tarballPath, npmCacheDir)
  await runSmokeCheck(installPrefix)
} finally {
  await rm(workspaceDir, { recursive: true, force: true })
}

async function mkdirTemp() {
  const { mkdtemp } = await import("node:fs/promises")
  return mkdtemp(join(tmpdir(), "structview-npm-smoke-"))
}

async function packTarball(packDestination) {
  const { stdout } = await execFileAsync(
    "npm",
    ["pack", "--quiet", "--pack-destination", packDestination],
    {
      cwd: repoRoot,
      env: process.env,
    },
  )
  const tarballName = stdout.trim().split(/\r?\n/).at(-1)

  if (!tarballName) {
    throw new Error("npm pack did not report a tarball name")
  }

  return join(packDestination, tarballName)
}

async function installTarball(installPath, tarballPath, cachePath) {
  await execFileAsync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-package-lock",
      "--prefix",
      installPath,
      tarballPath,
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        npm_config_cache: cachePath,
      },
    },
  )
}

async function runSmokeCheck(installPath) {
  await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "import { defineStruct, u8 } from '@rotu/structview'; import { u16be } from '@rotu/structview/bigendian'; class Sample extends defineStruct({ value: u8(0), wide: u16be(1) }) {} const sample = new Sample(new Uint8Array(3)); sample.value = 7; sample.wide = 0x0102; if (sample.value !== 7 || sample.wide !== 0x0102) throw new Error('npm smoke test failed');",
    ],
    {
      cwd: installPath,
      env: process.env,
    },
  )
}
