# structview agent and developer notes

This file holds repository workflow documentation that is mainly useful for contributors and coding agents.

## Local git hooks

Install repository hooks with:

```sh
git config core.hooksPath .vite-hooks
```

This enables the hooks in `.vite-hooks/`.

1. `pre-commit`: runs `vp staged`.

## Fixups

Run these after changing package metadata or CI/package validation behavior.

1. `vp run jsr:sync`: rewrite `jsr.json` from `package.json` metadata.
2. `vp run validate`: verify metadata sync, Vite+ static checks, Node-side tests, and the JSR dry-run.
3. `vp install --ignore-scripts`: refresh local dev dependencies from the current lockfile. This is required before local `vp run validate`, `vitest run`, `npm test`, `npm run test:node`, `bun run test`, and `npm run test:workers` commands.

## Commands

1. `vp run validate`: verify metadata sync, Vite+ static checks, tests, and the JSR dry-run.
2. `vp run build`: emit the npm `dist/` JavaScript files with `vp pack` while preserving the source module layout.
3. `vp run check`: verify synced metadata, formatting, and type-aware linting.
4. `vitest run`, `npm test`, and `npm run test:node`: run the Node-hosted test suite via the canonical Vitest CLI or package scripts.
5. `vitest bench --run` and `vp run bench`: run the Vitest benchmark suite directly or through the repo task.
6. `bun run test`, `npm run test:bun`, `deno x vp run test`, and `npm run test:deno`: run the test suite through Bun or Deno package-script entrypoints.
7. `npm run test:workers` and `vitest run --config ./vitest.workers.config.ts`: run the test suite inside the Cloudflare Workers runtime via the Workers Vitest pool.
8. `act -W .github/workflows/ci.yml`: run the CI workflow locally when `act` is installed.

## Releases

Releases are prepared locally and published from CI on tag push.

1. Ensure `CHANGELOG.md` includes a matching `## X.Y.Z` section.
2. Run `vp run release prepare <patch|minor|major|X.Y.Z>` to rehearse the release and update local version metadata. Use `vp run release dry-run <...>` if you only want the rehearsal.
3. Review `package.json`, `jsr.json`, and `package-lock.json` when present, then create the release commit and annotated tag `vX.Y.Z` manually.
4. Push with `git push origin HEAD --follow-tags`.
5. The tag-triggered publish workflow validates the tagged commit and publishes to npm and JSR.

## Tooling

`vite.config.ts` is the single source of truth for Vite+ run tasks, staged hooks, and pack configuration. `.oxlintrc.json` and `.oxfmtrc.json` own the standalone Oxc lint and format settings.
