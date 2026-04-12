import {
  bigintle,
  biguintle,
  bool,
  bytes,
  f16,
  f32,
  f64,
  fromDataView,
  i16,
  i32,
  i64,
  i8,
  string,
  substruct,
  typedArray,
  u16,
  u32,
  u64,
  u8,
} from "./fields.ts"
import { defineArray, defineStruct, Struct, structDataView } from "./core.ts"

import {
  deepStrictEqual,
  fail,
  ok as assert,
  strictEqual,
  throws,
} from "node:assert/strict"

import { expect, test } from "vitest"

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

test("struct has no enumerable properties", () => {
  const s = new Struct({ buffer: new ArrayBuffer(0) })
  for (const x in s) {
    fail(`unexpected key '${x}'`)
  }
})
test("defineStruct makes enumerable properties", () => {
  class S extends defineStruct({
    x: u32(0),
    y: f32(4),
  }) {}
  const enumeratedKeys = []
  for (const k in S.prototype) {
    enumeratedKeys.push(k)
  }
  deepStrictEqual(enumeratedKeys, ["x", "y"])
})

test("struct", () => {
  const s = new Struct({ buffer: new ArrayBuffer(10) })
  expect(s).toBeInstanceOf(Struct)
  deepStrictEqual(String(s), "[object Struct]")
})

test("constructor", () => {
  const buf = new ArrayBuffer(10)
  const s = new Struct({ buffer: buf })
  strictEqual(structDataView(s).buffer, buf)
  deepStrictEqual(Object.isExtensible(s), true)
  deepStrictEqual(Reflect.set(s, "extra", 123), true)
  deepStrictEqual(Reflect.get(s, "extra"), 123)
  const s2 = new Struct({ byteLength: 13 })
  deepStrictEqual(structDataView(s2).byteLength, 13)
  const s3 = new Struct({ byteLength: 5, byteOffset: 2 })
  deepStrictEqual(structDataView(s3).byteLength, 5)
  deepStrictEqual(structDataView(s3).byteOffset, 2)
  expect(structDataView(s3).buffer).toBeInstanceOf(ArrayBuffer)

  throws(() => {
    // @ts-expect-error invalid arg
    new Struct()
  })
  throws(() => {
    // @ts-expect-error invalid arg
    new Struct(null)
  })
  throws(() => {
    // @ts-expect-error invalid arg
    new Struct({})
  })
  throws(() => {
    // @ts-expect-error invalid arg
    new Struct({ byteOffset: 1 })
  })
})

test("vec3", () => {
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
  deepStrictEqual(Object.getOwnPropertyNames(someVec), [])
  deepStrictEqual(someVec[0], 0)
  deepStrictEqual(someVec[1], 42)
  deepStrictEqual(someVec[2], 1.5)

  // can be converted to an array
  deepStrictEqual([...someVec], [0, 42, 1.5])

  // can be mutated
  someVec[0] = 42
  // and mutations take
  deepStrictEqual(someVec[0], someVec[1])
  // mutations are propagated to the underlying buffer
  deepStrictEqual(bytes.slice(0, 4), bytes.slice(4, 8))

  deepStrictEqual(Object.getOwnPropertyNames(someVec), [])
})

test("string", () => {
  const Cls = defineStruct({
    hello: string(10, 40),
  })
  const c = new Cls(new Uint8Array(60))
  deepStrictEqual(c.hello, "")
  c.hello = "world!"
  deepStrictEqual(c.hello, "world!")
  c.hello = "abc\0def"
  deepStrictEqual(c.hello, "abc\0def")
})

test("bool", () => {
  const bytes = new Uint8Array([0, -1])
  const Cls = defineStruct({
    a: bool(0),
    b: bool(1),
  })
  const c = new Cls(bytes)
  deepStrictEqual(c.a, false)
  deepStrictEqual(c.b, true)
  c.a = true
  deepStrictEqual(c.a, true)
  deepStrictEqual(bytes[0], 1)
  c.a = false
  deepStrictEqual(c.a, false)
  deepStrictEqual(bytes[0], 0)
})

test("substruct", () => {
  const Point2D = defineStruct({ x: f32(0), y: f32(4) })
  const Square = defineStruct({
    size: f32(0),
    center: substruct(Point2D, 4, 8),
  })
  const buf = new Float32Array([1, 3.5, 123])
  const square = new Square(buf)
  deepStrictEqual(square.size, 1)
  deepStrictEqual(square.center.x, 3.5)
  deepStrictEqual(square.center.y, 123)
  square.center.x = 18
  deepStrictEqual(buf[1], 18)
})

test("integers", () => {
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
  deepStrictEqual(b.as_i8, 0x01)
  deepStrictEqual(b.as_u8, 0x01)
  deepStrictEqual(b.as_i16, 0x0201)
  deepStrictEqual(b.as_u16, 0x0201)
  deepStrictEqual(b.as_i32, 0x04030201)
  deepStrictEqual(b.as_u32, 0x04030201)
  deepStrictEqual(b.as_i64, 0x0807060504030201n)
  deepStrictEqual(b.as_u64, 0x0807060504030201n)
})

test("floats", () => {
  const Floats = defineStruct({
    f32: f32(4),
    f64: f64(8),
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
    class S extends defineStruct({ f16: f16(0) }) {}
    const v = new S(new Uint8Array(2))
    deepStrictEqual(v.f16, 0)
    v.f16 = 1.5
    deepStrictEqual(v.f16, 1.5)
    v.f16 = 1 / 3
    deepStrictEqual(v.f16, 0.333251953125)
  },
)

test("bad property descriptor", () => {
  throws(() => {
    defineStruct({
      a: { value: 10, get: () => 42 },
    })
  })
})

test("arrayRelative", () => {
  const bytes = new Uint8Array(Array(255).keys())
  const El = defineStruct({
    x: u8(2),
  })
  const ElArray = defineArray({ struct: El, byteStride: 3, length: 3 })
  const Cls = defineStruct({
    els: substruct(ElArray, 5),
  })
  const instance = new Cls(bytes)
  deepStrictEqual(instance.els.item(0).x, 2 + 0 * 3 + 5)
  deepStrictEqual(instance.els.item(1).x, 2 + 1 * 3 + 5)
  deepStrictEqual(instance.els.item(2).x, 2 + 2 * 3 + 5)
})

test("structArray", () => {
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
  deepStrictEqual(ar.length, 2)
  deepStrictEqual(ar.item(0).x, 0x00)
  deepStrictEqual(ar.item(0).y, 0x02)
  deepStrictEqual(ar.item(1).x, 0x03)
  deepStrictEqual(ar.item(1).y, 0x05)

  // and that iteration/unpacking works
  const [el0, el1, el2] = ar
  deepStrictEqual(el0.x, 0x00)
  deepStrictEqual(el0.y, 0x02)
  deepStrictEqual(el1.x, 0x03)
  deepStrictEqual(el1.y, 0x05)
  deepStrictEqual(el2, undefined)
})

test("dynamicLength", () => {
  const El = defineStruct({
    x: i8(0),
    y: i8(2),
  })
  const ElArray = defineArray({ struct: El, byteStride: 3 })
  const buf1 = new Uint8Array(9)
  const ar1 = new ElArray(buf1)
  const buf2 = new Uint8Array(21)
  const ar2 = new ElArray(buf2)

  deepStrictEqual(ar1.length, 3)
  deepStrictEqual(ar2.length, 7)

  ar1.item(2).x = -21
  deepStrictEqual(buf1[6], 235)

  ar2.item(6).y = -67
  deepStrictEqual(buf2[20], 189)
})

test("can copy", () => {
  const bytes = new Uint8Array(48)
  const Entree = defineStruct({
    price: f32(0),
    name: string(4, 12),
  })
  const Menu = defineArray({
    struct: Entree,
    byteStride: 16,
    length: 3,
  })

  const myMenu = new Menu(bytes)
  Object.assign(myMenu.item(0), { name: "garden salad", price: 4 })
  Object.assign(myMenu.item(1), { name: "soup du jour", price: 2.5 })
  Object.assign(myMenu.item(2), { name: "fries", price: 2.25 })

  const bytesCopy = Uint8Array.from(bytes)
  const menuCopy = new Menu(bytesCopy)
  deepStrictEqual(menuCopy.length, 3)
  deepStrictEqual(menuCopy.item(0).name, "garden salad")
  deepStrictEqual(menuCopy.item(0).price, 4)
  deepStrictEqual(menuCopy.item(1).name, "soup du jour")
  deepStrictEqual(menuCopy.item(1).price, 2.5)
  deepStrictEqual(menuCopy.item(2).name, "fries")
  deepStrictEqual(menuCopy.item(2).price, 2.25)
})

test("bigints", () => {
  const buf = hexToUint8Array("d6ffffffffffffffffffffff0c0d0e0f10111213")
  class S extends defineStruct({
    unsigned: biguintle(2, { byteLength: 12 }),
    signed: bigintle(2, { byteLength: 12 }),
  }) {}

  const s = new S(buf)
  deepStrictEqual(s.unsigned, 0xd0cffffffffffffffffffffn)
  deepStrictEqual(s.signed, 0xd0cffffffffffffffffffffn)

  s.signed = -0x42n
  deepStrictEqual(s.unsigned, 0xffffffffffffffffffffffben)
  deepStrictEqual(s.signed, -0x42n)
  deepStrictEqual(
    uint8ArrayToHex(buf),
    "d6ffbeffffffffffffffffffffff0e0f10111213",
  )
})

test("typedArrayFix", () => {
  const buf = new Uint8Array(40)
  class S extends defineStruct({
    f32s: typedArray(4, { species: Float32Array, length: 2 }),
  }) {}
  const instance = new S(buf)
  expect(instance.f32s).toBeInstanceOf(Float32Array)
  deepStrictEqual(instance.f32s.length, 2)

  strictEqual(instance.f32s.buffer, buf.buffer)
  deepStrictEqual(instance.f32s.byteOffset, 4)
  deepStrictEqual(instance.f32s.length, 2)
})

test("typedArray", () => {
  const buf = new Uint8Array(40)
  class S extends defineStruct({
    data_length: u8(0),
    f32s: typedArray(4, { species: Float32Array, length: "data_length" }),
  }) {}
  const instance = new S(buf)
  deepStrictEqual(instance.data_length, 0)
  expect(instance.f32s).toBeInstanceOf(Float32Array)
  deepStrictEqual(instance.f32s.length, 0)
  strictEqual(instance.f32s.buffer, buf.buffer)
  instance.data_length = 3
  deepStrictEqual(instance.data_length, 3)
  expect(instance.f32s).toBeInstanceOf(Float32Array)
  deepStrictEqual(instance.f32s.length, 3)
  strictEqual(instance.f32s.buffer, buf.buffer)

  instance.f32s[0] = 1 / 3
  instance.f32s[1] = 1 / 6
  instance.f32s[2] = 1 / 9
  const f32s2 = new Float32Array([1 / 3, 1 / 6, 1 / 9])
  deepStrictEqual(new Float32Array(buf.buffer.slice(4, 16)), f32s2)
})

test("getter-only properties inferred as readonly", () => {
  class S extends defineStruct({
    y: {
      get() {
        return 42
      },
    },
    z: typedArray(9, { species: Uint8Array, length: 3 }),
    s: substruct(Struct, 0),
  }) {}
  const obj = new S(new Uint8Array(10))

  // note: this test is about the type assertions
  throws(() => {
    // @ts-expect-error assigning to readonly property
    obj.y = 1
  })
  throws(() => {
    // @ts-expect-error assigning to readonly property
    obj.z = new Uint8Array()
  })
  throws(() => {
    // @ts-expect-error assigning to readonly property
    obj.s = {}
  })
})

test("alloc", () => {
  class Unsized extends defineStruct({}) {}
  class Sized extends defineStruct({ x: u8(0) }) {
    static BYTE_LENGTH = 7
  }
  // must provide byte length for unsized structs
  throws(() => {
    Unsized.alloc()
  })
  const x3 = new Unsized({ buffer: undefined, byteLength: 3 })
  deepStrictEqual(structDataView(x3).byteLength, 3)
  const x4 = Unsized.alloc({ byteLength: 4 })
  deepStrictEqual(structDataView(x4).byteLength, 4)

  // can elide the byte length for sized structs
  const y = Sized.alloc()
  deepStrictEqual(structDataView(y).byteLength, 7)
  // can override the byte length in the constructor
  const z = Sized.alloc({ byteLength: 20 })
  deepStrictEqual(structDataView(z).byteLength, 20)

  // ensure correct typing (that alloc doesn't return a bare Struct)
  const _zz: Sized = z
})

test("fromDataView getter-only is readonly and enumerable", () => {
  class S extends defineStruct({
    val: fromDataView((dv) => dv.getUint8(0)),
  }) {}
  const buf = new Uint8Array([42])
  const obj = new S(buf)
  deepStrictEqual(obj.val, 42)

  // type test: val is readonly
  throws(() => {
    // @ts-expect-error assigning to readonly property
    obj.val = 1
  })

  // the descriptor should be enumerable
  const keys: string[] = []
  for (const k in S.prototype) {
    keys.push(k)
  }
  assert(keys.includes("val"))
})

test("fromDataView with setter is writable and enumerable", () => {
  class S extends defineStruct({
    val: fromDataView(
      (dv) => dv.getUint8(0),
      (dv, v) => dv.setUint8(0, v),
    ),
  }) {}
  const buf = new Uint8Array([0])
  const obj = new S(buf)
  obj.val = 99
  deepStrictEqual(obj.val, 99)
  deepStrictEqual(buf[0], 99)

  // type test: val is writable (no @ts-expect-error needed)
  const _: number = obj.val

  // the descriptor should be enumerable
  const keys: string[] = []
  for (const k in S.prototype) {
    keys.push(k)
  }
  assert(keys.includes("val"))
})

test("string variable-length (no byteLength)", () => {
  // 4 bytes prefix + 6 bytes for variable-length string
  const Cls = defineStruct({
    prefix: u32(0),
    name: string(4),
  })
  const c = new Cls(new Uint8Array(10))
  deepStrictEqual(c.name, "")
  c.name = "hello!"
  deepStrictEqual(c.name, "hello!")
  // trailing nulls are trimmed
  c.name = "hi"
  deepStrictEqual(c.name, "hi")
  // prefix field is unaffected
  c.prefix = 0xdeadbeef
  deepStrictEqual(c.prefix, 0xdeadbeef)
  deepStrictEqual(c.name, "hi")
})

test("bytes fixed-length", () => {
  const buf = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
  const Cls = defineStruct({
    data: bytes(2, 4),
  })
  const c = new Cls(buf)
  expect(c.data).toBeInstanceOf(Uint8Array)
  deepStrictEqual(c.data.length, 4)
  // is a live view of the same underlying buffer
  strictEqual(c.data.buffer, buf.buffer)
  deepStrictEqual(c.data.byteOffset, 2)
  // mutations through the Uint8Array are reflected in buf
  c.data[0] = 0xff
  deepStrictEqual(buf[2], 0xff)
  // is read-only (no setter)
  throws(() => {
    // @ts-expect-error assigning to readonly property
    c.data = new Uint8Array(4)
  })
})

test("bytes variable-length (no byteLength)", () => {
  const buf = new Uint8Array([10, 20, 30, 40, 50])
  const Cls = defineStruct({
    data: bytes(2),
  })
  const c = new Cls(buf)
  expect(c.data).toBeInstanceOf(Uint8Array)
  // extends from offset 2 to end of struct
  deepStrictEqual(c.data.length, 3)
  strictEqual(c.data.buffer, buf.buffer)
  deepStrictEqual(c.data.byteOffset, 2)
  // mutations through the Uint8Array are reflected in buf
  c.data[1] = 0xab
  deepStrictEqual(buf[3], 0xab)
  // is read-only (no setter)
  throws(() => {
    // @ts-expect-error assigning to readonly property
    c.data = new Uint8Array(3)
  })
})

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new TypeError("Hex input must have an even length")
  }

  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  )
}
