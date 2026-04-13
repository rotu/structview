/**
 * @file Benchmark tests for struct packing and unpacking. We don't care about being blazing fast -
 *   this is to make sure we're not doing anything _eggregiously slow_
 */

import { bench, describe, expect } from "vitest"

import { defineStruct, f32, f64, string, u16, u32, u8 } from "@rotu/structview"

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

const testBytes = hexToUint8Array("f304b53f182d4454fb2109406745230123010148656c6c6f20776f726c64")
const BYTE_LENGTH = 30

function manualUnpack(ab: ArrayBufferLike) {
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

function manualPack(x: typeof testObject) {
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

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("hex string must have an even length")
  }

  return Uint8Array.from({ length: hex.length / 2 }, (_, index) =>
    Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16),
  )
}

describe("pack", () => {
  bench("with Struct", () => {
    const result = new Uint8Array(BYTE_LENGTH)
    const s = new StructClass(result)
    s.x1 = testObject.x1
    s.x2 = testObject.x2
    s.x3 = testObject.x3
    s.x4 = testObject.x4
    s.x5 = testObject.x5
    s.x6 = testObject.x6
    expect(result).toStrictEqual(testBytes)
  })

  bench("manually", () => {
    const result = manualPack(testObject)
    expect(new Uint8Array(result)).toStrictEqual(testBytes)
  })
})

// Surprisingly, this turns out to be *faster* than the DataView version! I think it's because of V8 optimizations for a class instance vs an object literal.
describe("unpack", () => {
  bench("with Struct", () => {
    const result = new StructClass({ buffer: testBytes.buffer, byteLength: BYTE_LENGTH })
    expect(result.x1).toBe(testObject.x1)
    expect(result.x2).toBe(testObject.x2)
    expect(result.x3).toBe(testObject.x3)
    expect(result.x4).toBe(testObject.x4)
    expect(result.x5).toBe(testObject.x5)
    expect(result.x6).toBe(testObject.x6)
  })

  bench("manually", () => {
    const result = manualUnpack(testBytes.buffer)
    expect(result.x1).toBe(testObject.x1)
    expect(result.x2).toBe(testObject.x2)
    expect(result.x3).toBe(testObject.x3)
    expect(result.x4).toBe(testObject.x4)
    expect(result.x5).toBe(testObject.x5)
    expect(result.x6).toBe(testObject.x6)
  })
})
