/**
 * Benchmark tests for struct packing and unpacking.
 * We don't care about being blazing fast - this is to make sure we're not doing anything *eggregiously slow*
 * @module
 */

import { assertEquals } from "@std/assert/equals"
import { defineStruct, f32, f64, string, u16, u32, u8 } from "./mod.ts"

const StructClass = defineStruct({
  x1: f32(0),
  x2: f64(4),
  x3: u32(12),
  x4: u16(16),
  x5: u8(18),
  x6: string(19, 11),
})

const testObject = {
  x1: Math.fround(Math.SQRT2),
  x2: Math.PI,
  x3: 0x01234567,
  x4: 0x0123,
  x5: 0x01,
  x6: "Hello world",
}

const testBytes = Uint8Array.fromHex(
  "f304b53f182d4454fb2109406745230123010148656c6c6f20776f726c64",
)
const BYTE_LENGTH = 30

function manualUnpack(ab: ArrayBuffer) {
  const dv = new DataView(ab)
  return {
    x1: dv.getFloat32(0, true),
    x2: dv.getFloat64(4, true),
    x3: dv.getUint32(12, true),
    x4: dv.getUint16(16, true),
    x5: dv.getUint8(18),
    x6: new TextDecoder().decode(new Uint8Array(ab, 19, 11)),
  }
}

function manualPack(
  x: typeof testObject,
) {
  const ab = new ArrayBuffer(BYTE_LENGTH)
  const dv = new DataView(ab)
  dv.setFloat32(0, x.x1, true)
  dv.setFloat64(4, x.x2, true)
  dv.setUint32(12, x.x3, true)
  dv.setUint16(16, x.x4, true)
  dv.setUint8(18, x.x5)
  new TextEncoder().encodeInto(x.x6, new Uint8Array(ab, 19, 11))
  return ab
}

Deno.bench("pack with Struct", { group: "pack", baseline: true }, () => {
  const result = new Uint8Array(BYTE_LENGTH)
  const s = new StructClass(result)
  s.x1 = testObject.x1
  s.x2 = testObject.x2
  s.x3 = testObject.x3
  s.x4 = testObject.x4
  s.x5 = testObject.x5
  s.x6 = testObject.x6
  assertEquals(result, testBytes)
})

Deno.bench("pack manually", { group: "pack" }, () => {
  const result = manualPack(testObject)
  assertEquals(new Uint8Array(result), testBytes)
})

// Surprisingly, this turns out to be *faster* than the DataView version! I think it's because of V8 optimizations for a class instance vs an object literal.
Deno.bench("unpack with Struct", { group: "unpack", baseline: true }, () => {
  const result = new StructClass({
    buffer: testBytes.buffer,
    byteLength: BYTE_LENGTH,
  })
  assertEquals(result.x1, testObject.x1)
  assertEquals(result.x2, testObject.x2)
  assertEquals(result.x3, testObject.x3)
  assertEquals(result.x4, testObject.x4)
  assertEquals(result.x5, testObject.x5)
  assertEquals(result.x6, testObject.x6)
})

Deno.bench("unpack manually", { group: "unpack" }, () => {
  const result = manualUnpack(testBytes.buffer)
  assertEquals(result.x1, testObject.x1)
  assertEquals(result.x2, testObject.x2)
  assertEquals(result.x3, testObject.x3)
  assertEquals(result.x4, testObject.x4)
  assertEquals(result.x5, testObject.x5)
  assertEquals(result.x6, testObject.x6)
})
