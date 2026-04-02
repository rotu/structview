import { defineStruct } from "./core.ts"
import {
  f16,
  f16be,
  f32be,
  f64be,
  i16,
  i16be,
  i32,
  i32be,
  i64,
  i64be,
  u16,
  u16be,
  u32,
  u32be,
  u64,
  u64be,
} from "./fields.ts"

import { deepStrictEqual } from "node:assert/strict"

import { test } from "vitest"

test("integers", () => {
  const buf = new Uint8Array(16)
  const Integers = defineStruct({
    as_i16: i16(1),
    as_i32: i32(1),
    as_i64: i64(1),
    as_u16: u16(1),
    as_u32: u32(1),
    as_u64: u64(1),

    as_i16be: i16be(1),
    as_i32be: i32be(1),
    as_i64be: i64be(1),
    as_u16be: u16be(1),
    as_u32be: u32be(1),
    as_u64be: u64be(1),
  })
  const b = new Integers(buf)
  b.as_i16be = 0x0102
  deepStrictEqual(b.as_i16be, 0x0102)
  deepStrictEqual(b.as_i16, 0x0201)
  deepStrictEqual(b.as_u16be, 0x0102)
  deepStrictEqual(b.as_u16, 0x0201)

  b.as_i32be = 0x01020304
  deepStrictEqual(b.as_i32be, 0x01020304)
  deepStrictEqual(b.as_i32, 0x04030201)
  deepStrictEqual(b.as_u32be, 0x01020304)
  deepStrictEqual(b.as_u32, 0x04030201)

  b.as_i64be = 0x0102030405060708n
  deepStrictEqual(b.as_i64be, 0x0102030405060708n)
  deepStrictEqual(b.as_i64, 0x0807060504030201n)
  deepStrictEqual(b.as_u64be, 0x0102030405060708n)
  deepStrictEqual(b.as_u64, 0x0807060504030201n)
})

test("floats", () => {
  const Floats = defineStruct({
    f32: f32be(4),
    f64: f64be(8),
  })
  const bytes = new Uint8Array(16)
  const v = new Floats(bytes)
  deepStrictEqual(v.f32, 0)
  deepStrictEqual(v.f64, 0)
  v.f32 = 1 / 3
  v.f64 = 1 / 3
  deepStrictEqual(v.f32, Math.fround(1 / 3))
  deepStrictEqual(v.f64, 1 / 3)
})

test.skipIf(typeof DataView.prototype.getFloat16 !== "function")(
  "float16",
  () => {
    const bytes = new Uint8Array(2)
    class F16BE extends defineStruct({ value: f16be(0) }) {}
    class F16LE extends defineStruct({ value: f16(0) }) {}
    const vbe = new F16BE(bytes)
    const vle = new F16LE(bytes)

    deepStrictEqual(vbe.value, 0)
    deepStrictEqual(vle.value, 0)

    vbe.value = 1.5e3
    deepStrictEqual(vbe.value, 1.5e3)
    deepStrictEqual(vle.value, -281.25)

    bytes.reverse()
    deepStrictEqual(vbe.value, -281.25)
    deepStrictEqual(vle.value, 1.5e3)
  },
)
