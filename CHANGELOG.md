# Changelog

This changelog was generated from retroactive release notes and the git history. It mirrors `RELEASE_NOTES_RETRO.md` and is intended to be the canonical, human-readable changelog going forward.

## 2026-01-20
- bbf2aff — fix oidc publishing
- 6367cf8 — minor fixes

## 2026-01-10
- 8149f55 — type defineArray with item method instead of element
- c2703d7 — ci: use Trusted Publishing instead of npm token
- 338cc56 — ci: test in Node and Bun

## 2025-11-14
- 5b5d3bb — typo
- 1e1542c — lint

## 2025-11-10
- 703ee48 — Support static `.alloc` method and static `BYTE_LENGTH` field for fixed-sized structs

## 2025-10-22
- a92e393 — infer fields with no setter as readonly
- 34481d1 — Fix badge links
- ca94807 — Make `instanceof Struct` work better when bundled
- 1d20200 — Update README.md
- d8ea5bd — `defineStruct` will now make properties enumerable if not specified
- 345f6a4 — export bigendian module in npm build
- 0664541 — formatting
- ccc734e — Add bigendian to main module exports

## 2025-10-19 → 2025-10-12 (staging and documentation)
- 33f9cdd — Caveat about own properties
- 9ae8b4a — Documentation
- feaf6c3 — Move `fromDataView` to `fields`
- 980b488 — Support native TypedArray fields
- 99c71ce — Format
- 6c6b4e9 — Missing type annotation
- a7abdfa — reorganize - no functional changes
- 8bd28e5 — Another fix for Node tests
- 84f20aa — fix for running tests under Node
- a89e04f — Merge branch 'main' of https://github.com/rotu/struct

## 2025-10-11 — Release activity and breaking changes
- 9e6d578 — 0.7.1
- ba74096 — 0.6.1
- 1849e1b — Publish to npm
- 2041827 — BREAKING: remove numeric accessor for StructArray `ar[i]`, deprecate `ar.element(i)`. Please use `ar.item(i)` instead.
- 0a29538 — compatibility fix (arraybuffer argument used to be mandatory)
- e38c2b0 — Throw an error early when float16 not supported.
- 4a19d56 — readonly instead of getter in type declarations (TypeScript compiler issue)
- 4adc807 — Improve readme

## 2025-10-10 → 2025-10-07 — New features and publishing
- a689209 — Add benchmarks
- e64aebd — Add 1-byte boolean field declarator
- a73a3e3 — Add JSR badge
- b991206 — Publish to JSR from CI (#2)
- caace83 — Struct constructor can allocate a struct if no buffer provided
- d9966ea — Document arrays better
- 9145818 — document bigendian
- 802cd20 — Add big-endian support
- c658491 — Add test for nested positioning
- 298a70e — Support dynamic-length arrays
- 9a4e60c — Add support for statically-sized array of struct
- 48a48c4 — fix property descriptor typing

## Notes and next steps
- There are no annotated git tags in this repository; releases are inferred from commit messages that reference version numbers and publishing activity.
- Recommended next steps:
  - Annotate historical commits with proper annotated tags (e.g. `v0.6.1`, `v0.7.1`) if you want conventional release tracking.
  - Expand individual sections with links to PRs and issue numbers if available.
  - Maintain this file alongside future changelogs or convert it into a conventional changelog format.

Generated from repository commit history using `git log` on the `main` branch.
