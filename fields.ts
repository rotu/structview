/**
 * Factories for property descriptors representing fields in a binary struct
 * @module
 */

import { structBytes, structDataView } from "./core.ts"
import type {
  ReadOnlyAccessorDescriptor,
  StructConstructor,
  StructPropertyDescriptor,
  TypedArraySpecies,
} from "./types.ts"

/**
 * Field for a 8-bit unsigned integer
 */
export function u8(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
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
): StructPropertyDescriptor<string>
/**
 * Field for a UTF-8 string whose byte length is determined at read time.
 *
 * @remarks The returned descriptor is read-only because writing a string of
 * variable size requires external coordination (e.g. also updating the length
 * field). Use `fromDataView` for a writable custom implementation.
 *
 * @param fieldOffset - Byte offset of the string within the struct.
 * @param options.length - A property name on the struct whose value gives the
 *   byte length, or a function `(dv: DataView) => number` that computes it.
 */
export function string(
  fieldOffset: number,
  options: { readonly length: string | ((dv: DataView) => number) },
): StructPropertyDescriptor<string> & ReadOnlyAccessorDescriptor<string>
export function string(
  fieldOffset: number,
  arg: number | { readonly length: string | ((dv: DataView) => number) },
): StructPropertyDescriptor<string> {
  const TEXT_DECODER = new TextDecoder()
  const TEXT_ENCODER = new TextEncoder()
  if (typeof arg === "number") {
    const byteLength = arg
    return {
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
  const { length } = arg
  return {
    get() {
      const dv = structDataView(this)
      const len: number = typeof length === "string"
        ? (Reflect.get(this, length) as number)
        : length(dv)
      const str = TEXT_DECODER.decode(
        structBytes(this, fieldOffset, fieldOffset + len),
      )
      return str.replace(/\0+$/, "")
    },
  }
}

/**
 * Field for a boolean stored in a byte (0 = false, nonzero = true)
 * True will be stored as 1
 */
export function bool(fieldOffset: number): StructPropertyDescriptor<boolean> {
  return {
    get() {
      return Boolean(structDataView(this).getUint8(fieldOffset))
    },
    set(value) {
      structDataView(this).setUint8(fieldOffset, value ? 1 : 0)
    },
  }
}

/**
 * Wrap a field descriptor to make it optional, returning `null` when the field
 * is considered absent.
 *
 * The returned descriptor inherits the writability of the wrapped descriptor:
 * - If `descriptor` has a setter, the returned descriptor also has a setter.
 * - If `descriptor` has no setter (read-only), the returned descriptor is
 *   read-only too.
 *
 * Two presence strategies are supported:
 *
 * **Sentinel value** — the field is absent when its binary value equals the
 * sentinel (compared via `Object.is`).  Setting the property to `null` writes
 * the sentinel back into the buffer.
 *
 * ```ts
 * const Cls = defineStruct({
 *   value: optional(u16(0), { sentinel: 0xffff }),
 * })
 * ```
 *
 * **Predicate function** — the field is absent when the predicate returns
 * `false`.  Setting the field to a non-null value writes it normally;
 * setting to `null` is a no-op.
 *
 * ```ts
 * const Cls = defineStruct({
 *   flags: u8(0),
 *   value: optional(u32(4), (dv) => (dv.getUint8(0) & 0x01) !== 0),
 * })
 * ```
 */
export function optional<T>(
  descriptor: StructPropertyDescriptor<T> & { set(t: T): undefined },
  presence: ((dv: DataView) => boolean) | { readonly sentinel: T },
): StructPropertyDescriptor<T | null>
export function optional<T>(
  descriptor: StructPropertyDescriptor<T>,
  presence: ((dv: DataView) => boolean) | { readonly sentinel: T },
): StructPropertyDescriptor<T | null> & ReadOnlyAccessorDescriptor<T | null>
export function optional<T>(
  descriptor: StructPropertyDescriptor<T>,
  presence: ((dv: DataView) => boolean) | { readonly sentinel: T },
): StructPropertyDescriptor<T | null> {
  if (typeof presence === "function") {
    const result: StructPropertyDescriptor<T | null> = {
      get() {
        if (!presence(structDataView(this))) return null
        return descriptor.get!.call(this) as T
      },
    }
    if (typeof descriptor.set === "function") {
      result.set = function (value: T | null) {
        if (value !== null) {
          descriptor.set!.call(this, value)
        }
      }
    }
    return result
  }
  const { sentinel } = presence
  const result: StructPropertyDescriptor<T | null> = {
    get() {
      const value = descriptor.get!.call(this) as T
      return Object.is(value, sentinel) ? null : value
    },
  }
  if (typeof descriptor.set === "function") {
    result.set = function (value: T | null) {
      descriptor.set!.call(this, value === null ? sentinel : value)
    }
  }
  return result
}

export function fromDataView<T>(
  fieldGetter: (dv: DataView) => T,
  fieldSetter: (dv: DataView, value: T) => void,
): StructPropertyDescriptor<T>
export function fromDataView<T>(
  fieldGetter: (dv: DataView) => T,
): StructPropertyDescriptor<T> & ReadOnlyAccessorDescriptor<T>
export function fromDataView<T>(
  fieldGetter: (dv: DataView) => T,
  fieldSetter?: (dv: DataView, value: T) => void,
): StructPropertyDescriptor<T> {
  if (fieldSetter !== undefined) {
    return {
      enumerable: true,
      get() {
        const dv = structDataView(this)
        return fieldGetter(dv)
      },
      set(value) {
        const dv = structDataView(this)
        fieldSetter(dv, value)
      },
    }
  }
  return {
    enumerable: true,
    get() {
      const dv = structDataView(this)
      return fieldGetter(dv)
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
): StructPropertyDescriptor<T> & ReadOnlyAccessorDescriptor<T> {
  return fromDataView(
    (dv) => {
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
 * Field for a typed array
 *
 * @remarks
 *
 * I'm not totally happy with this.
 * - TypedArray does not support endianness.
 * - Changing the length property of the parent struct will not change the length of the returned value. `a=x.ar; x.arlength=2;` will not change a's length (though it will still be a live view of the underlying buffer).
 *
 * @param fieldOffset  where the array starts relative to the parent struct
 */
export function typedArray<T>(
  fieldOffset: number,
  kwargs: {
    /** length, property name, function, or undefined (fill remaining buffer) */
    readonly length:
      | number
      | string
      | ((dv: DataView) => number)
      | undefined
    /** TypedArray constructor */
    readonly species: TypedArraySpecies<T>
  },
): StructPropertyDescriptor<T> & ReadOnlyAccessorDescriptor<T> {
  const { length, species } = kwargs
  return {
    get() {
      const dv = structDataView(this)
      let lengthValue: number | undefined
      if (typeof length === "undefined") {
        lengthValue = Math.floor(
          (dv.byteLength - fieldOffset) / species.BYTES_PER_ELEMENT,
        )
      } else if (typeof length === "number") {
        lengthValue = length
      } else if (typeof length === "string") {
        lengthValue = Reflect.get(this, length)
      } else if (typeof length === "function") {
        lengthValue = length(dv)
      }
      return new species(
        dv.buffer,
        dv.byteOffset + fieldOffset,
        lengthValue,
      )
    },
  }
}

/**
 * Field for a big-endian 16-bit unsigned integer
 */
export function u16be(fieldOffset: number): StructPropertyDescriptor<number> {
  return {
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
    get() {
      return structDataView(this).getFloat64(fieldOffset, false)
    },
    set(value) {
      structDataView(this).setFloat64(fieldOffset, value, false)
    },
  }
}
