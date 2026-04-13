import {
  bigendian,
  defineArray,
  defineStruct,
  Struct,
  structDataView,
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
  u16be,
  u32,
  u64,
  u8,
} from "@rotu/structview"
import { expect, test } from "vitest"

class vec3_t extends defineStruct({ 0: f32(0), 1: f32(4), 2: f32(8) }) {
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
  const enumerableKeys: string[] = []
  for (const x in s) {
    enumerableKeys.push(x)
  }
  expect(enumerableKeys).toStrictEqual([])
})

test("defineStruct makes enumerable properties", () => {
  class S extends defineStruct({ x: u32(0), y: f32(4) }) {}
  const enumeratedKeys = []
  for (const k in S.prototype) {
    enumeratedKeys.push(k)
  }
  expect(enumeratedKeys).toStrictEqual(["x", "y"])
})

test("struct", () => {
  const s = new Struct({ buffer: new ArrayBuffer(10) })
  expect(s).toBeInstanceOf(Struct)
  expect(Object.prototype.toString.call(s)).toBe("[object Struct]")
})

test("top-level bigendian namespace", () => {
  expect(Object.prototype.toString.call(bigendian)).toBe("[object Module]")
  expect(Object.getPrototypeOf(bigendian)).toBeNull()
  expect(bigendian.u16be).toBe(u16be)

  class S extends defineStruct({ value: bigendian.u16be(0) }) {}

  const sample = new S(new Uint8Array([0x01, 0x02]))
  expect(sample.value).toBe(0x0102)
})

test("constructor", () => {
  const buf = new ArrayBuffer(10)
  const s = new Struct({ buffer: buf })
  expect(structDataView(s).buffer).toBe(buf)
  expect(Object.isExtensible(s)).toBe(true)
  expect(Reflect.set(s, "extra", 123)).toBe(true)
  expect(Reflect.get(s, "extra")).toBe(123)
  const s2 = new Struct({ byteLength: 13 })
  expect(structDataView(s2).byteLength).toBe(13)
  const s3 = new Struct({ byteLength: 5, byteOffset: 2 })
  expect(structDataView(s3).byteLength).toBe(5)
  expect(structDataView(s3).byteOffset).toBe(2)
  expect(structDataView(s3).buffer).toBeInstanceOf(ArrayBuffer)

  expect(() => {
    // @ts-expect-error invalid arg
    new Struct()
  }).toThrow(TypeError)
  expect(() => {
    // @ts-expect-error invalid arg
    new Struct(null)
  }).toThrow(TypeError)
  expect(() => {
    // @ts-expect-error invalid arg
    new Struct({})
  }).toThrow(TypeError)
  expect(() => {
    // @ts-expect-error invalid arg
    new Struct({ byteOffset: 1 })
  }).toThrow(TypeError)
})

test("vec3", () => {
  const bytes = new Uint8Array([0, 0, 0, 0, 0, 0, 0x28, 0x42, 0, 0, 0xc0, 0x3f])
  const someVec = new vec3_t(bytes)
  expect(someVec).toBeInstanceOf(Struct)
  expect(Object.getOwnPropertyNames(someVec)).toStrictEqual([])
  expect(someVec[0]).toBe(0)
  expect(someVec[1]).toBe(42)
  expect(someVec[2]).toBe(1.5)

  // can be converted to an array
  expect([...someVec]).toStrictEqual([0, 42, 1.5])

  // can be mutated
  someVec[0] = 42
  // and mutations take
  expect(someVec[0]).toBe(someVec[1])
  // mutations are propagated to the underlying buffer
  expect(bytes.slice(0, 4)).toStrictEqual(bytes.slice(4, 8))

  expect(Object.getOwnPropertyNames(someVec)).toStrictEqual([])
})

test("string", () => {
  const Cls = defineStruct({ hello: string(10, 40) })
  const c = new Cls(new Uint8Array(60))
  expect(c.hello).toBe("")
  c.hello = "world!"
  expect(c.hello).toBe("world!")
  c.hello = "abc\0def"
  expect(c.hello).toBe("abc\0def")
})

test("bool", () => {
  const bytes = new Uint8Array([0, -1])
  const Cls = defineStruct({ a: bool(0), b: bool(1) })
  const c = new Cls(bytes)
  expect(c.a).toBe(false)
  expect(c.b).toBe(true)
  c.a = true
  expect(c.a).toBe(true)
  expect(bytes[0]).toBe(1)
  c.a = false
  expect(c.a).toBe(false)
  expect(bytes[0]).toBe(0)
})

test("substruct", () => {
  const Point2D = defineStruct({ x: f32(0), y: f32(4) })
  const Square = defineStruct({ size: f32(0), center: substruct(Point2D, 4, 8) })
  const buf = new Float32Array([1, 3.5, 123])
  const square = new Square(buf)
  expect(square.size).toBe(1)
  expect(square.center.x).toBe(3.5)
  expect(square.center.y).toBe(123)
  square.center.x = 18
  expect(buf[1]).toBe(18)
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
  expect(b.as_i8).toBe(0x01)
  expect(b.as_u8).toBe(0x01)
  expect(b.as_i16).toBe(0x0201)
  expect(b.as_u16).toBe(0x0201)
  expect(b.as_i32).toBe(0x04030201)
  expect(b.as_u32).toBe(0x04030201)
  expect(b.as_i64).toBe(0x0807060504030201n)
  expect(b.as_u64).toBe(0x0807060504030201n)
})

test("floats", () => {
  const Floats = defineStruct({ f32: f32(4), f64: f64(8) })
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
  class S extends defineStruct({ f16: f16(0) }) {}
  const v = new S(new Uint8Array(2))
  expect(v.f16).toBe(0)
  v.f16 = 1.5
  expect(v.f16).toBe(1.5)
  v.f16 = 1 / 3
  expect(v.f16).toBe(0.333251953125)
})

test("bad property descriptor", () => {
  expect(() => {
    defineStruct({ a: { value: 10, get: () => 42 } })
  }).toThrow(TypeError)
})

test("arrayRelative", () => {
  const bytes = new Uint8Array(Array(255).keys())
  const El = defineStruct({ x: u8(2) })
  const ElArray = defineArray({ struct: El, byteStride: 3, length: 3 })
  const Cls = defineStruct({ els: substruct(ElArray, 5) })
  const instance = new Cls(bytes)
  expect(instance.els.item(0).x).toBe(7)
  expect(instance.els.item(1).x).toBe(10)
  expect(instance.els.item(2).x).toBe(13)
})

test("structArray", () => {
  const El = defineStruct({ x: u8(0), y: u8(2) })
  const ElArray = defineArray({ struct: El, byteStride: 3, length: 2 })
  const buf = new Uint8Array(6)
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = i
  }
  const ar = new ElArray(buf)
  expect(ar.length).toBe(2)
  expect(ar.item(0).x).toBe(0x00)
  expect(ar.item(0).y).toBe(0x02)
  expect(ar.item(1).x).toBe(0x03)
  expect(ar.item(1).y).toBe(0x05)

  // and that iteration/unpacking works
  const [el0, el1, el2] = ar
  expect(el0.x).toBe(0x00)
  expect(el0.y).toBe(0x02)
  expect(el1.x).toBe(0x03)
  expect(el1.y).toBe(0x05)
  expect(el2).toBeUndefined()
})

test("dynamicLength", () => {
  const El = defineStruct({ x: i8(0), y: i8(2) })
  const ElArray = defineArray({ struct: El, byteStride: 3 })
  const buf1 = new Uint8Array(9)
  const ar1 = new ElArray(buf1)
  const buf2 = new Uint8Array(21)
  const ar2 = new ElArray(buf2)

  expect(ar1.length).toBe(3)
  expect(ar2.length).toBe(7)

  ar1.item(2).x = -21
  expect(buf1[6]).toBe(235)

  ar2.item(6).y = -67
  expect(buf2[20]).toBe(189)
})

test("can copy", () => {
  const bytes = new Uint8Array(48)
  const Entree = defineStruct({ price: f32(0), name: string(4, 12) })
  const Menu = defineArray({ struct: Entree, byteStride: 16, length: 3 })

  const myMenu = new Menu(bytes)
  Object.assign(myMenu.item(0), { name: "garden salad", price: 4 })
  Object.assign(myMenu.item(1), { name: "soup du jour", price: 2.5 })
  Object.assign(myMenu.item(2), { name: "fries", price: 2.25 })

  const bytesCopy = Uint8Array.from(bytes)
  const menuCopy = new Menu(bytesCopy)
  expect(menuCopy.length).toBe(3)
  expect(menuCopy.item(0).name).toBe("garden salad")
  expect(menuCopy.item(0).price).toBe(4)
  expect(menuCopy.item(1).name).toBe("soup du jour")
  expect(menuCopy.item(1).price).toBe(2.5)
  expect(menuCopy.item(2).name).toBe("fries")
  expect(menuCopy.item(2).price).toBe(2.25)
})

test("bigints", () => {
  const buf = hexToUint8Array("d6ffffffffffffffffffffff0c0d0e0f10111213")
  class S extends defineStruct({
    unsigned: biguintle(2, { byteLength: 12 }),
    signed: bigintle(2, { byteLength: 12 }),
  }) {}

  const s = new S(buf)
  expect(s.unsigned).toBe(0xd0cffffffffffffffffffffn)
  expect(s.signed).toBe(0xd0cffffffffffffffffffffn)

  s.signed = -0x42n
  expect(s.unsigned).toBe(0xffffffffffffffffffffffben)
  expect(s.signed).toBe(-0x42n)
  expect(uint8ArrayToHex(buf)).toBe("d6ffbeffffffffffffffffffffff0e0f10111213")
})

test("typedArrayFix", () => {
  const buf = new Uint8Array(40)
  class S extends defineStruct({ f32s: typedArray(4, { species: Float32Array, length: 2 }) }) {}
  const instance = new S(buf)
  expect(instance.f32s).toBeInstanceOf(Float32Array)
  expect(instance.f32s.length).toBe(2)

  expect(instance.f32s.buffer).toBe(buf.buffer)
  expect(instance.f32s.byteOffset).toBe(4)
  expect(instance.f32s.length).toBe(2)
})

test("typedArray", () => {
  const buf = new Uint8Array(40)
  class S extends defineStruct({
    data_length: u8(0),
    f32s: typedArray(4, { species: Float32Array, length: "data_length" }),
  }) {}
  const instance = new S(buf)
  expect(instance.data_length).toBe(0)
  expect(instance.f32s).toBeInstanceOf(Float32Array)
  expect(instance.f32s.length).toBe(0)
  expect(instance.f32s.buffer).toBe(buf.buffer)
  instance.data_length = 3
  expect(instance.data_length).toBe(3)
  expect(instance.f32s).toBeInstanceOf(Float32Array)
  expect(instance.f32s.length).toBe(3)
  expect(instance.f32s.buffer).toBe(buf.buffer)

  instance.f32s[0] = 1 / 3
  instance.f32s[1] = 1 / 6
  instance.f32s[2] = 1 / 9
  const f32s2 = new Float32Array([1 / 3, 1 / 6, 1 / 9])
  expect(new Float32Array(buf.buffer.slice(4, 16))).toStrictEqual(f32s2)
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
  expect(() => {
    // @ts-expect-error assigning to readonly property
    obj.y = 1
  }).toThrow(TypeError)
  expect(() => {
    // @ts-expect-error assigning to readonly property
    obj.z = new Uint8Array()
  }).toThrow(TypeError)
  expect(() => {
    // @ts-expect-error assigning to readonly property
    obj.s = {}
  }).toThrow(TypeError)
})

test("alloc", () => {
  class Unsized extends defineStruct({}) {}
  class Sized extends defineStruct({ x: u8(0) }) {
    static BYTE_LENGTH = 7
  }
  // must provide byte length for unsized structs
  expect(() => {
    Unsized.alloc()
  }).toThrow(TypeError)
  const x3: any = new Unsized({ buffer: undefined, byteLength: 3 })
  expect(structDataView(x3).byteLength).toBe(3)
  const x4 = Unsized.alloc({ byteLength: 4 })
  expect(structDataView(x4).byteLength).toBe(4)

  // can elide the byte length for sized structs
  const y = Sized.alloc()
  expect(structDataView(y).byteLength).toBe(7)
  // can override the byte length in the constructor
  const z = Sized.alloc({ byteLength: 20 })
  expect(structDataView(z).byteLength).toBe(20)

  // ensure correct typing (that alloc doesn't return a bare Struct)
  const _zz: Sized = z
})

test("fromDataView getter-only is readonly and enumerable", () => {
  class S extends defineStruct({ val: fromDataView((dv) => dv.getUint8(0)) }) {}
  const buf = new Uint8Array([42])
  const obj = new S(buf)
  expect(obj.val).toBe(42)

  // type test: val is readonly
  expect(() => {
    // @ts-expect-error assigning to readonly property
    obj.val = 1
  }).toThrow(TypeError)

  // the descriptor should be enumerable
  const keys: string[] = []
  for (const k in S.prototype) {
    keys.push(k)
  }
  expect(keys).toContain("val")
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
  expect(obj.val).toBe(99)
  expect(buf[0]).toBe(99)

  // type test: val is writable (no @ts-expect-error needed)
  const _: number = obj.val

  // the descriptor should be enumerable
  const keys: string[] = []
  for (const k in S.prototype) {
    keys.push(k)
  }
  expect(keys).toContain("val")
})

test("string variable-length (no byteLength)", () => {
  // 4 bytes prefix + 6 bytes for variable-length string
  const Cls = defineStruct({ prefix: u32(0), name: string(4) })
  const c = new Cls(new Uint8Array(10))
  expect(c.name).toBe("")
  c.name = "hello!"
  expect(c.name).toBe("hello!")
  // trailing nulls are trimmed
  c.name = "hi"
  expect(c.name).toBe("hi")
  // prefix field is unaffected
  c.prefix = 0xdeadbeef
  expect(c.prefix).toBe(0xdeadbeef)
  expect(c.name).toBe("hi")
})

test("bytes fixed-length", () => {
  const buf = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
  const Cls = defineStruct({ data: bytes(2, 4) })
  const c = new Cls(buf)
  expect(c.data).toBeInstanceOf(Uint8Array)
  expect(c.data.length).toBe(4)
  // is a live view of the same underlying buffer
  expect(c.data.buffer).toBe(buf.buffer)
  expect(c.data.byteOffset).toBe(2)
  // mutations through the Uint8Array are reflected in buf
  c.data[0] = 0xff
  expect(buf[2]).toBe(0xff)
  // is read-only (no setter)
  expect(() => {
    // @ts-expect-error assigning to readonly property
    c.data = new Uint8Array(4)
  }).toThrow(TypeError)
})

test("bytes variable-length (no byteLength)", () => {
  const buf = new Uint8Array([10, 20, 30, 40, 50])
  const Cls = defineStruct({ data: bytes(2) })
  const c = new Cls(buf)
  expect(c.data).toBeInstanceOf(Uint8Array)
  // extends from offset 2 to end of struct
  expect(c.data.length).toBe(3)
  expect(c.data.buffer).toBe(buf.buffer)
  expect(c.data.byteOffset).toBe(2)
  // mutations through the Uint8Array are reflected in buf
  c.data[1] = 0xab
  expect(buf[3]).toBe(0xab)
  // is read-only (no setter)
  expect(() => {
    // @ts-expect-error assigning to readonly property
    c.data = new Uint8Array(3)
  }).toThrow(TypeError)
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
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}
