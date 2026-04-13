/** @file Strongly typed classes for accessing binary data in a structured way */

import { f16be, f32be, f64be, i16be, i32be, i64be, u16be, u32be, u64be } from "./fields.ts"

export * from "./types.ts"
export * from "./core.ts"
export * from "./fields.ts"

type BigendianNamespace = Readonly<{
  f16be: typeof f16be
  f32be: typeof f32be
  f64be: typeof f64be
  i16be: typeof i16be
  i32be: typeof i32be
  i64be: typeof i64be
  u16be: typeof u16be
  u32be: typeof u32be
  u64be: typeof u64be
  [Symbol.toStringTag]: "Module"
}>

export const bigendian = Object.preventExtensions(
  Object.create(null, {
    f16be: { enumerable: true, value: f16be },
    f32be: { enumerable: true, value: f32be },
    f64be: { enumerable: true, value: f64be },
    i16be: { enumerable: true, value: i16be },
    i32be: { enumerable: true, value: i32be },
    i64be: { enumerable: true, value: i64be },
    u16be: { enumerable: true, value: u16be },
    u32be: { enumerable: true, value: u32be },
    u64be: { enumerable: true, value: u64be },
    [Symbol.toStringTag]: { value: "Module" },
  }),
) as BigendianNamespace
