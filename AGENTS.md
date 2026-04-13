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
3. `vp install --ignore-scripts`: refresh local dev dependencies from the current lockfile. This is required before local `vp run validate`, `vp test run`, `npm test`, and `bun run test` commands.

## Commands

Operational commands are documented here so Vite+ remains the canonical command surface: `vite.config.ts` carries the custom task entrypoints, and `package.json` only keeps lifecycle hooks.

1. `vp run validate`: verify metadata sync, Vite+ static checks, tests, and the JSR dry-run.
2. `vp run build`: emit the npm `dist/` JavaScript files with `vp pack` while preserving the source module layout.
3. `vp run check`: verify synced metadata, formatting, and type-aware linting.
4. `vp test run`, `npm test`, and `bun run test`: run the test suite via the canonical Vite+ command, the Node wrapper, and the Bun wrapper.
5. `vp run bench`: run the Vitest benchmark suite.
6. `act -W .github/workflows/ci.yml`: run the CI workflow locally when `act` is installed.

## Releases

Releases are prepared locally and published from CI on tag push.

1. Ensure `CHANGELOG.md` includes a matching `## X.Y.Z` section.
2. Run `vp run release prepare <patch|minor|major|X.Y.Z>` to rehearse the release and update local version metadata. Use `vp run release dry-run <...>` if you only want the rehearsal.
3. Review `package.json`, `jsr.json`, and `package-lock.json` when present, then create the release commit and annotated tag `vX.Y.Z` manually.
4. Push with `git push origin HEAD --follow-tags`.
5. The tag-triggered publish workflow validates the tagged commit and publishes to npm and JSR.

## Tooling

`vite.config.ts` is the single source of truth for Vite+, lint, format, staged, and pack configuration.
