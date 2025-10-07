import {
  defineArray,
  defineStruct,
  f16,
  f32,
  f64,
  i16,
  i32,
  i64,
  i8,
  string,
  Struct,
  substruct,
  u16,
  u32,
  u64,
  u8,
} from "./mod.ts"

import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertThrows,
  fail,
} from "@std/assert"

class vec3_t extends defineStruct({
  0: f32(0),
  1: f32(4),
  2: f32(8),
}) {
  get length() {
    return 3
  }
  *[Symbol.iterator]() {
    yield this[0]
    yield this[1]
    yield this[2]
  }
}

Deno.test("struct has no enumerable properties", () => {
  const s = new Struct({ buffer: new ArrayBuffer() })
  for (const x in s) {
    fail(`unexpected key '${x}'`)
  }
})

Deno.test("struct", () => {
  const s = new Struct({ buffer: new ArrayBuffer(10) })
  assertInstanceOf(s, Struct)
  assertEquals(String(s), "[object Struct]")
})

Deno.test("vec3", () => {
  const bytes = new Uint8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0x28,
    0x42,
    0,
    0,
    0xc0,
    0x3f,
  ])
  const someVec = new vec3_t(bytes)
  assert(someVec instanceof Struct)
  assertEquals(Object.getOwnPropertyNames(someVec), [])
  assertEquals(someVec[0], 0)
  assertEquals(someVec[1], 42)
  assertEquals(someVec[2], 1.5)

  // trying to add an out of bound value errors
  assertThrows(() => {
    // @ts-expect-error assignment to undeclared property
    someVec.blahbityblah = 5
  })

  assertThrows(() => {
    // @ts-expect-error assignment to undeclared property
    someVec[3] = 5
  })

  // can be converted to an array
  assertEquals([...someVec], [0, 42, 1.5])

  // can be mutated
  someVec[0] = 42
  // and mutations take
  assertEquals(someVec[0], someVec[1])
  // mutations are propagated to the underlying buffer
  assertEquals(bytes.slice(0, 4), bytes.slice(4, 8))

  assertEquals(Object.getOwnPropertyNames(someVec), [])
})

Deno.test("string", () => {
  const Cls = defineStruct({
    hello: string(10, 40),
  })
  const c = new Cls(new Uint8Array(60))
  assertEquals(c.hello, "")
  c.hello = "world!"
  assertEquals(c.hello, "world!")
  c.hello = "abc\0def"
  assertEquals(c.hello, "abc\0def")
})

Deno.test("substruct", () => {
  const Point2D = defineStruct({ x: f32(0), y: f32(4) })
  const Square = defineStruct({
    size: f32(0),
    center: substruct(Point2D, 4, 8),
  })
  const buf = new Float32Array([1, 3.5, 123])
  const square = new Square(buf)
  assertEquals(square.size, 1)
  assertEquals(square.center.x, 3.5)
  assertEquals(square.center.y, 123)
  square.center.x = 18
  assertEquals(buf[1], 18)
})

Deno.test("integers", () => {
  const buf = new Uint8Array(16)
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = i
  }
  const Integers = defineStruct({
    as_i8: i8(1),
    as_i16: i16(1),
    as_i32: i32(1),
    as_i64: i64(1),
    as_u8: u8(1),
    as_u16: u16(1),
    as_u32: u32(1),
    as_u64: u64(1),
  })
  const b = new Integers(buf)
  assertEquals(b.as_i8, 0x01)
  assertEquals(b.as_u8, 0x01)
  assertEquals(b.as_i16, 0x0201)
  assertEquals(b.as_u16, 0x0201)
  assertEquals(b.as_i32, 0x04030201)
  assertEquals(b.as_u32, 0x04030201)
  assertEquals(b.as_i64, 0x0807060504030201n)
  assertEquals(b.as_u64, 0x0807060504030201n)
})

Deno.test("floats", () => {
  const Floats = defineStruct({
    f16: f16(0),
    f32: f32(4),
    f64: f64(8),
  })
  const bytes = new Uint8Array(16)
  const v = new Floats(bytes)
  assertEquals(v.f16, 0)
  assertEquals(v.f32, 0)
  assertEquals(v.f64, 0)
  v.f16 = 1 / 3
  v.f32 = 1 / 3
  v.f64 = 1 / 3
  assertEquals(v.f16, Math.f16round(1 / 3))
  assertEquals(v.f32, Math.fround(1 / 3))
  assertEquals(v.f64, 1 / 3)
})

Deno.test("bad property descriptor", () => {
  assertThrows(() => {
    defineStruct({
      a: { value: 10, get: () => 42 },
    })
  })
})

Deno.test("structArray", () => {
  const El = defineStruct({
    x: u8(0),
    y: u8(2),
  })
  const ElArray = defineArray({ struct: El, byteStride: 3, length: 2 })
  const buf = new Uint8Array(6)
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = i
  }
  const ar = new ElArray(buf)
  assertEquals(ar.length, 2)
  assertEquals(ar[0].x, 0x00)
  assertEquals(ar[0].y, 0x02)
  assertEquals(ar[1].x, 0x03)
  assertEquals(ar[1].y, 0x05)

  // and that iteration/unpacking works
  const [el0, el1, el2] = ar
  assertEquals(el0.x, 0x00)
  assertEquals(el0.y, 0x02)
  assertEquals(el1.x, 0x03)
  assertEquals(el1.y, 0x05)
  assertEquals(el2, undefined)
})

Deno.test("dynamicLength", () => {
  const El = defineStruct({
    x: i8(0),
    y: i8(2),
  })
  const ElArray = defineArray({ struct: El, byteStride: 3 })
  const buf1 = new Uint8Array(9)
  const ar1 = new ElArray(buf1)
  const buf2 = new Uint8Array(21)
  const ar2 = new ElArray(buf2)

  assertEquals(ar1.length, 3)
  assertEquals(ar2.length, 7)

  ar1[2].x = -21
  assertEquals(buf1[6], 235)

  ar2[6].y = -67
  assertEquals(buf2[20], 189)
})
