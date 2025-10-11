import {
  f16be,
  f32be,
  f64be,
  i16be,
  i32be,
  i64be,
  u16be,
  u32be,
  u64be,
} from "./bigendian.ts"
import { defineStruct, f16, i16, i32, i64, u16, u32, u64 } from "./mod.ts"

import { assertEquals } from "@std/assert"

Deno.test("integers", () => {
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
  assertEquals(b.as_i16be, 0x0102)
  assertEquals(b.as_i16, 0x0201)
  assertEquals(b.as_u16be, 0x0102)
  assertEquals(b.as_u16, 0x0201)

  b.as_i32be = 0x01020304
  assertEquals(b.as_i32be, 0x01020304)
  assertEquals(b.as_i32, 0x04030201)
  assertEquals(b.as_u32be, 0x01020304)
  assertEquals(b.as_u32, 0x04030201)

  b.as_i64be = 0x0102030405060708n
  assertEquals(b.as_i64be, 0x0102030405060708n)
  assertEquals(b.as_i64, 0x0807060504030201n)
  assertEquals(b.as_u64be, 0x0102030405060708n)
  assertEquals(b.as_u64, 0x0807060504030201n)
})

Deno.test("floats", () => {
  const Floats = defineStruct({
    f32: f32be(4),
    f64: f64be(8),
  })
  const bytes = new Uint8Array(16)
  const v = new Floats(bytes)
  assertEquals(v.f32, 0)
  assertEquals(v.f64, 0)
  v.f32 = 1 / 3
  v.f64 = 1 / 3
  assertEquals(v.f32, Math.fround(1 / 3))
  assertEquals(v.f64, 1 / 3)
})

Deno.test({
  name: "float16",
  ignore: typeof DataView.prototype.getFloat16 !== "function",
  fn: () => {
    const bytes = new Uint8Array(2)
    class F16BE extends defineStruct({ value: f16be(0) }) {}
    class F16LE extends defineStruct({ value: f16(0) }) {}
    const vbe = new F16BE(bytes)
    const vle = new F16LE(bytes)

    assertEquals(vbe.value, 0)
    assertEquals(vle.value, 0)

    vbe.value = 1.5e3
    assertEquals(vbe.value, 1.5e3)
    assertEquals(vle.value, -281.25)

    bytes.reverse()
    assertEquals(vbe.value, -281.25)
    assertEquals(vle.value, 1.5e3)
  },
})
