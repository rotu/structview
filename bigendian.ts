import { structDataView, type StructPropertyDescriptor } from "./mod.ts"

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
