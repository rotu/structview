/**
 * Factories for property descriptors representing fields in a binary struct
 * @module
 */

import { fromDataView, structBytes, structDataView } from "./core.ts"
import type { StructConstructor, StructPropertyDescriptor } from "./types.ts"

/**
 * Field for a 8-bit unsigned integer
 */
export function u8(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getUint8(fieldOffset)
    },
    set(value) {
      structDataView(this).setUint8(fieldOffset, value)
    },
  }
}
/**
 * Field for a little-endian 16-bit unsigned integer
 */
export function u16(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getUint16(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setUint16(fieldOffset, value, true)
    },
  }
}
/**
 * Field for a little-endian 32-bit unsigned integer
 */
export function u32(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getUint32(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setUint32(fieldOffset, value, true)
    },
  }
}
/**
 * Field for a little-endian 64-bit unsigned integer
 */
export function u64(fieldOffset: number): StructPropertyDescriptor<bigint> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getBigUint64(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setBigUint64(fieldOffset, value, true)
    },
  }
}
/**
 * Field for a little-endian 8-bit signed integer
 */
export function i8(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getInt8(fieldOffset)
    },
    set(value) {
      structDataView(this).setInt8(fieldOffset, value)
    },
  }
}
/**
 * Field for a little-endian 16-bit signed integer
 */
export function i16(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getInt16(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setInt16(fieldOffset, value, true)
    },
  }
}
/**
 * Field for a little-endian 32-bit signed integer
 */
export function i32(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getInt32(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setInt32(fieldOffset, value, true)
    },
  }
}
/**
 * Field for a little-endian 64-bit signed integer
 */
export function i64(fieldOffset: number): StructPropertyDescriptor<bigint> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getBigInt64(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setBigInt64(fieldOffset, value, true)
    },
  }
}

/**
 * Field for a little-endian unsigned integer of arbitrary byte length
 */
export function biguintle(
  fieldOffset: number,
  { byteLength }: { byteLength: number },
): StructPropertyDescriptor<bigint> {
  if (
    !Number.isInteger(byteLength) ||
    !(0 < byteLength)
  ) {
    throw new TypeError("byteLength must be a positive integer")
  }
  return {
    get() {
      let result = 0n
      const dv = structDataView(this)
      for (let i = 0; i < byteLength; ++i) {
        result |= BigInt(dv.getUint8(fieldOffset + i)) << BigInt(8 * i)
      }
      return result
    },
    set(value) {
      const dv = structDataView(this)
      for (let i = 0; i < byteLength; ++i) {
        dv.setUint8(
          fieldOffset + i,
          Number((value >> BigInt(8 * i)) & 0xffn),
        )
      }
    },
  }
}

/**
 * Field for a little-endian signed integer of arbitrary byte length
 */
export function bigintle(
  offset: number,
  options: { byteLength: number },
): StructPropertyDescriptor<bigint> {
  const { byteLength } = options
  return {
    get() {
      let result = 0n
      const dv = structDataView(this)
      for (let i = 0; i < byteLength; ++i) {
        result |= BigInt(dv.getUint8(offset + i)) << BigInt(8 * i)
      }
      return BigInt.asIntN(byteLength * 8, result)
    },
    set(value) {
      const dv = structDataView(this)
      for (let i = 0; i < byteLength; ++i) {
        dv.setUint8(
          offset + i,
          Number((value >> BigInt(8 * i)) & 0xffn),
        )
      }
    },
  }
}

/**
 * Field for a little-endian 16-bit binary float (float16_t)
 */
export function f16(fieldOffset: number): StructPropertyDescriptor<number> {
  if (
    typeof DataView.prototype.getFloat16 !== "function" ||
    typeof DataView.prototype.setFloat16 !== "function"
  ) {
    throw new TypeError("float16 is not supported in this environment")
  }
  return {
    enumerable: true,
    get() {
      return structDataView(this).getFloat16(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setFloat16(fieldOffset, value, true)
    },
  }
}

/**
 * Field for a little-endian 32-bit binary float (float32_t)
 */
export function f32(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getFloat32(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setFloat32(fieldOffset, value, true)
    },
  }
}

/**
 * Field for a little-endian 64-bit binary float (float64_t)
 */
export function f64(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getFloat64(fieldOffset, true)
    },
    set(value) {
      structDataView(this).setFloat64(fieldOffset, value, true)
    },
  }
}

/**
 * Field for a UTF-8 fixed-length string
 */
export function string(
  fieldOffset: number,
  byteLength: number,
): StructPropertyDescriptor<string> {
  const TEXT_DECODER = new TextDecoder()
  const TEXT_ENCODER = new TextEncoder()
  return {
    enumerable: true,
    get() {
      const str = TEXT_DECODER.decode(
        structBytes(this, fieldOffset, fieldOffset + byteLength),
      )
      // trim all trailing null characters
      return str.replace(/\0+$/, "")
    },
    set(value) {
      const bytes = structBytes(
        this,
        fieldOffset,
        fieldOffset + byteLength,
      )
      bytes.fill(0)
      TEXT_ENCODER.encodeInto(value, bytes)
    },
  }
}

/**
 * Field for a boolean stored in a byte (0 = false, nonzero = true)
 * True will be stored as 1
 */
export function bool(fieldOffset: number): StructPropertyDescriptor<boolean> {
  return {
    enumerable: true,
    get() {
      return Boolean(structDataView(this).getUint8(fieldOffset))
    },
    set(value) {
      structDataView(this).setUint8(fieldOffset, value ? 1 : 0)
    },
  }
}

/**
 * Field for an embedded struct
 * @param ctor constructor for the inner struct
 * @param byteOffset where the inner struct starts relative to the outer struct
 * @param bytelength the length in bytes of the inner struct
 * @returns property descriptor for a struct
 */
export function substruct<
  T extends object,
>(
  ctor: StructConstructor<T>,
  byteOffset?: number,
  bytelength?: number,
): StructPropertyDescriptor<T> {
  return fromDataView(
    function (dv) {
      const offset2 = dv.byteOffset + (byteOffset ?? 0)
      const bytelength2 = bytelength ?? (dv.byteLength - (byteOffset ?? 0))
      return Reflect.construct(ctor, [{
        buffer: dv.buffer,
        byteOffset: offset2,
        byteLength: bytelength2,
      }])
    },
  )
}

/**
 * Field for a big-endian 16-bit unsigned integer
 */
export function u16be(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getUint16(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setUint16(fieldOffset, value, false)
    },
  }
}
/**
 * Field for a big-endian 32-bit unsigned integer
 */
export function u32be(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getUint32(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setUint32(fieldOffset, value, false)
    },
  }
}
/**
 * Field for a big-endian 64-bit unsigned integer
 */
export function u64be(fieldOffset: number): StructPropertyDescriptor<bigint> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getBigUint64(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setBigUint64(fieldOffset, value, false)
    },
  }
}
/**
 * Field for a big-endian 16-bit signed integer
 */
export function i16be(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getInt16(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setInt16(fieldOffset, value, false)
    },
  }
}
/**
 * Field for a big-endian 32-bit signed integer
 */
export function i32be(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getInt32(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setInt32(fieldOffset, value, false)
    },
  }
}
/**
 * Field for a big-endian 64-bit signed integer
 */
export function i64be(fieldOffset: number): StructPropertyDescriptor<bigint> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getBigInt64(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setBigInt64(fieldOffset, value, false)
    },
  }
}

/**
 * Field for a big-endian 16-bit binary float (float16_t)
 */
export function f16be(fieldOffset: number): StructPropertyDescriptor<number> {
  if (
    typeof DataView.prototype.getFloat16 !== "function" ||
    typeof DataView.prototype.setFloat16 !== "function"
  ) {
    throw new TypeError("float16 is not supported in this environment")
  }
  return {
    enumerable: true,
    get() {
      return structDataView(this).getFloat16(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setFloat16(fieldOffset, value, false)
    },
  }
}

/**
 * Field for a big-endian 32-bit binary float (float32_t)
 */
export function f32be(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getFloat32(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setFloat32(fieldOffset, value, false)
    },
  }
}

/**
 * Field for a big-endian 64-bit binary float (float64_t)
 */
export function f64be(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
    enumerable: true,
    get() {
      return structDataView(this).getFloat64(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setFloat64(fieldOffset, value, false)
    },
  }
}
