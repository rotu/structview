# Changelog

## 0.17.0-pre — 2026-04-12

- Add variable-length `string` field: `byteLength` is now optional and defaults to the end of the struct's buffer.
- Add `bytes` field: returns a live `Uint8Array` view into the struct's buffer, with optional fixed or variable length.

## 0.16.2 — 2026-04-05

- Fix npm package imports under Node by shipping JavaScript entrypoints instead of relying on TypeScript-only package resolution from `node_modules`.

## 0.16.1 — 2026-04-02

- Align release publishing so npm and JSR stay version-synchronized.

## 0.16.0 — 2026-04-01

- BREAKING: `Struct` no longer calls `Object.preventExtensions()` during construction. If you want non-extensible instances, call `Object.preventExtensions()` yourself after object construction.

## 0.15.0 — 2026-03-27

- cc3b63a — Fix fromDataView: enumerable, complete comment, optional setter, readonly inference (#5)

## 0.14.1 — 2026-01-20

- 6367cf8 — minor fixes

## 0.14.0 — 2026-01-10

- 8149f55 — type defineArray with item method instead of element

## 0.13.1 — 2026-01-10

- 338cc56 — ci: test in Node and Bun

## 0.13.0 — 2025-11-10

- 703ee48 — Support static `.alloc` method and static `BYTE_LENGTH` field for fixed-sized structs

## 0.12.0 — 2025-10-22

- a92e393 — infer fields with no setter as readonly

## 0.11.1 — 2025-10-22

- ca94807 — Make `instanceof Struct` work better when bundled

## 0.11.0 — 2025-10-21

- d8ea5bd — `defineStruct` will now make properties enumerable if not specified

## 0.10.3 — 2025-10-20

- 345f6a4 — export bigendian module in npm build

## 0.10.2 — 2025-10-20

- ccc734e — Add bigendian to main module exports

## 0.10.1 — 2025-10-19

- feaf6c3 — Move `fromDataView` to `fields`

## 0.10.0 — 2025-10-15

- 980b488 — Support native TypedArray fields

## 0.9.0 — 2025-10-12

- a7abdfa — reorganize - no functional changes

## 0.8.2 — 2025-10-12

- 8bd28e5 — Another fix for Node tests

## 0.8.1 — 2025-10-12

- 84f20aa — fix for running tests under Node

## 0.8.0 — 2025-10-12

- f2b19b8 — bigint

## 0.7.3 — 2025-10-11

- 8c1bd00 — tighten up types

## 0.7.2 — 2025-10-11

- 5b337ab — better typing for array types

## 0.7.1 — 2025-10-11

- 9e6d578 — 0.7.1

## 0.7.0 — 2025-10-11

- 1849e1b — Publish to npm

## 0.6.1 — 2025-10-11

- ba74096 — 0.6.1

## 0.6.0 — 2025-10-10

- e64aebd — Add 1-byte boolean field declarator

## 0.5.0 — 2025-10-10

- caace83 — Struct constructor can allocate a struct if no buffer provided

## 0.4.2 — 2025-10-08

- d9966ea — Document arrays better

## 0.4.1 — 2025-10-07

- 9145818 — document bigendian

## 0.4.0 — 2025-10-07

- 802cd20 — Add big-endian support

## 0.3.0 — 2025-10-07

- 298a70e — Support dynamic-length arrays

## 0.2.0 — 2025-10-07

- 9a4e60c — Add support for statically-sized array of struct

## 0.1.2 — 2025-10-07

- 48a48c4 — fix property descriptor typing

## 0.1.1 — 2025-10-07

- 3d626b3 — Move example to readme

## 0.1.0 — 2025-10-06

- b4c4106 — wip
