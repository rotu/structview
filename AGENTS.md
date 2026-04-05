# structview agent and developer notes

This file holds repository workflow documentation that is mainly useful for
contributors and coding agents.

## Local git hooks

Install repository hooks with:

```sh
git config core.hooksPath .githooks
```

This enables the hooks in `.githooks/`.

1. `pre-commit`: runs `deno fmt --check` and `deno lint`.

## Fixups

Run these after changing package metadata or CI/package validation behavior.

1. `deno run -A scripts/sync-package-metadata.ts`: rewrite `deno.json` from
   `package.json` metadata.
2. `deno task validate`: verify formatting, lint, tests, JSR dry-run, npm pack
   dry-run, and a Node install/import smoke test.
3. `npm install --no-package-lock --ignore-scripts`: refresh local dev
   dependencies without introducing a lockfile. This is required before local
   `deno task validate`, `npm x vitest run`, and `bun x vitest run` commands.

## Commands

Operational commands are documented here so `deno.json` only carries the main
aggregate validation entrypoint.

1. `deno task validate`: verify metadata sync, format, lint, tests, JSR dry-run,
   npm pack dry-run, and the Node smoke test.
2. `deno x vitest run`: run the Vitest suite through Deno.
3. `npm test`: run the Node-side Vitest suite and the npm install/import smoke
   test.
4. `npm x vitest run`: run the Vitest suite in Node.
5. `bun x vitest run`: run the Vitest suite in Bun.
6. `npm run smoke:npm`: pack the current tree, install it into a temporary Node
   project, and verify the installed package imports successfully.
7. `deno x vitest bench --run`: run the Vitest benchmark suite.
8. `act -W .github/workflows/ci.yml`: run the CI workflow locally when `act` is
   installed.

## Releases

Use the manual GitHub Actions workflow `Release` to cut a release.

1. Choose a version bump (`patch`, `minor`, `major`) or provide an explicit
   version.
2. Ensure `CHANGELOG.md` includes a matching `## X.Y.Z` section.
3. Run with `publish=true` to publish to JSR and npm, or `publish=false` for
   dry-run publish checks without pushing a tag or creating a GitHub release.
4. The release workflow uses `package.json` as the version source of truth and
   syncs `deno.json` from it before publishing.
