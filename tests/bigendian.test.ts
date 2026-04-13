import {
  defineStruct,
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
} from "@rotu/structview"
import { expect, test } from "vitest"

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
  expect(b.as_i16be).toBe(0x0102)
  expect(b.as_i16).toBe(0x0201)
  expect(b.as_u16be).toBe(0x0102)
  expect(b.as_u16).toBe(0x0201)

  b.as_i32be = 0x01020304
  expect(b.as_i32be).toBe(0x01020304)
  expect(b.as_i32).toBe(0x04030201)
  expect(b.as_u32be).toBe(0x01020304)
  expect(b.as_u32).toBe(0x04030201)

  b.as_i64be = 0x0102030405060708n
  expect(b.as_i64be).toBe(0x0102030405060708n)
  expect(b.as_i64).toBe(0x0807060504030201n)
  expect(b.as_u64be).toBe(0x0102030405060708n)
  expect(b.as_u64).toBe(0x0807060504030201n)
})

test("floats", () => {
  const Floats = defineStruct({ f32: f32be(4), f64: f64be(8) })
  const bytes = new Uint8Array(16)
  const v = new Floats(bytes)
  expect(v.f32).toBe(0)
  expect(v.f64).toBe(0)
  v.f32 = 1 / 3
  v.f64 = 1 / 3
  expect(v.f32).toBe(Math.fround(1 / 3))
  expect(v.f64).toBe(1 / 3)
})

// @ts-ignore float16 is not present in the current lib target yet.
const hasFloat16 = typeof DataView.prototype.getFloat16 === "function"

test.skipIf(!hasFloat16)("float16", () => {
  const bytes = new Uint8Array(2)
  class F16BE extends defineStruct({ value: f16be(0) }) {}
  class F16LE extends defineStruct({ value: f16(0) }) {}
  const vbe = new F16BE(bytes)
  const vle = new F16LE(bytes)

  expect(vbe.value).toBe(0)
  expect(vle.value).toBe(0)

  vbe.value = 1.5e3
  expect(vbe.value).toBe(1.5e3)
  expect(vle.value).toBe(-281.25)

  bytes.reverse()
  expect(vbe.value).toBe(-281.25)
  expect(vle.value).toBe(1.5e3)
})
