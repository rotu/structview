/**
 * Factories for property descriptors representing fields in a binary struct
 * @module
 */

import { structBytes, structDataView } from "./core.ts"
import type {
  AnyStruct,
  ReadOnlyAccessorDescriptor,
  StructConstructor,
  StructPropertyDescriptor,
  TypedArraySpecies,
} from "./types.ts"

type ResolvableValue<T> = T | string | ((struct: AnyStruct) => T)
type BooleanFieldValue = ResolvableValue<boolean>
type NumberFieldValue = ResolvableValue<number>
type OptionalNumberFieldValue = ResolvableValue<number | undefined> | undefined

function resolveFieldValue<T>(
  struct: AnyStruct,
  value: ResolvableValue<T>,
): T {
  if (typeof value === "function") {
    return value(struct)
  }
  if (typeof value === "string") {
    return Reflect.get(struct, value)
  }
  return value
}

function resolveNumberFieldValue(
  struct: AnyStruct,
  value: NumberFieldValue,
  name: string,
): number {
  const result = resolveFieldValue(struct, value)
  if (typeof result !== "number") {
    throw new TypeError(`${name} must resolve to a number`)
  }
  return result
}

function resolveOptionalNumberFieldValue(
  struct: AnyStruct,
  value: OptionalNumberFieldValue,
  name: string,
): number | undefined {
  if (typeof value === "undefined") {
    return undefined
  }
  const result = resolveFieldValue(struct, value)
  if (typeof result !== "number" && typeof result !== "undefined") {
    throw new TypeError(`${name} must resolve to a number or undefined`)
  }
  return result
}

function resolvePositiveIntegerFieldValue(
  struct: AnyStruct,
  value: NumberFieldValue,
  name: string,
): number {
  const result = resolveNumberFieldValue(struct, value, name)
  if (!Number.isInteger(result) || result <= 0) {
    throw new TypeError(`${name} must resolve to a positive integer`)
  }
  return result
}

function resolveBooleanFieldValue(
  struct: AnyStruct,
  value: BooleanFieldValue,
): boolean {
  const result = resolveFieldValue(struct, value)
  if (typeof result !== "boolean") {
    throw new TypeError("present must resolve to a boolean")
  }
  return result
}

function setBooleanFieldValue(
  struct: AnyStruct,
  value: string | ((struct: AnyStruct, present: boolean) => void),
  present: boolean,
) {
  if (typeof value === "function") {
    value(struct, present)
    return
  }
  if (typeof value === "string") {
    Reflect.set(struct, value, present)
    return
  }
  throw new TypeError(
    "optional field presence must be settable via a property name or callback",
  )
}

function dataViewField<T>(
  fieldOffset: NumberFieldValue,
  fieldGetter: (dv: DataView, offset: number) => T,
  fieldSetter: (dv: DataView, offset: number, value: T) => void,
): StructPropertyDescriptor<T> {
  return {
    get() {
      const dv = structDataView(this)
      const offset = resolveNumberFieldValue(this, fieldOffset, "fieldOffset")
      return fieldGetter(dv, offset)
    },
    set(value) {
      const dv = structDataView(this)
      const offset = resolveNumberFieldValue(this, fieldOffset, "fieldOffset")
      fieldSetter(dv, offset, value)
    },
  }
}

/**
 * Field for a 8-bit unsigned integer
 */
export function u8(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getUint8(offset),
    (dv, offset, value) => dv.setUint8(offset, value),
  )
}
/**
 * Field for a little-endian 16-bit unsigned integer
 */
export function u16(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getUint16(offset, true),
    (dv, offset, value) => dv.setUint16(offset, value, true),
  )
}
/**
 * Field for a little-endian 32-bit unsigned integer
 */
export function u32(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getUint32(offset, true),
    (dv, offset, value) => dv.setUint32(offset, value, true),
  )
}
/**
 * Field for a little-endian 64-bit unsigned integer
 */
export function u64(fieldOffset: NumberFieldValue): StructPropertyDescriptor<bigint> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getBigUint64(offset, true),
    (dv, offset, value) => dv.setBigUint64(offset, value, true),
  )
}
/**
 * Field for a little-endian 8-bit signed integer
 */
export function i8(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getInt8(offset),
    (dv, offset, value) => dv.setInt8(offset, value),
  )
}
/**
 * Field for a little-endian 16-bit signed integer
 */
export function i16(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getInt16(offset, true),
    (dv, offset, value) => dv.setInt16(offset, value, true),
  )
}
/**
 * Field for a little-endian 32-bit signed integer
 */
export function i32(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getInt32(offset, true),
    (dv, offset, value) => dv.setInt32(offset, value, true),
  )
}
/**
 * Field for a little-endian 64-bit signed integer
 */
export function i64(fieldOffset: NumberFieldValue): StructPropertyDescriptor<bigint> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getBigInt64(offset, true),
    (dv, offset, value) => dv.setBigInt64(offset, value, true),
  )
}

/**
 * Field for a little-endian unsigned integer of arbitrary byte length
 */
export function biguintle(
  fieldOffset: NumberFieldValue,
  { byteLength }: { byteLength: NumberFieldValue },
): StructPropertyDescriptor<bigint> {
  return {
    get() {
      const resolvedFieldOffset = resolveNumberFieldValue(
        this,
        fieldOffset,
        "fieldOffset",
      )
      const resolvedByteLength = resolvePositiveIntegerFieldValue(
        this,
        byteLength,
        "byteLength",
      )
      let result = 0n
      const dv = structDataView(this)
      for (let i = 0; i < resolvedByteLength; ++i) {
        result |= BigInt(dv.getUint8(resolvedFieldOffset + i)) << BigInt(8 * i)
      }
      return result
    },
    set(value) {
      const resolvedFieldOffset = resolveNumberFieldValue(
        this,
        fieldOffset,
        "fieldOffset",
      )
      const resolvedByteLength = resolvePositiveIntegerFieldValue(
        this,
        byteLength,
        "byteLength",
      )
      const dv = structDataView(this)
      for (let i = 0; i < resolvedByteLength; ++i) {
        dv.setUint8(
          resolvedFieldOffset + i,
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
  offset: NumberFieldValue,
  options: { byteLength: NumberFieldValue },
): StructPropertyDescriptor<bigint> {
  const { byteLength } = options
  return {
    get() {
      const resolvedOffset = resolveNumberFieldValue(this, offset, "fieldOffset")
      const resolvedByteLength = resolvePositiveIntegerFieldValue(
        this,
        byteLength,
        "byteLength",
      )
      let result = 0n
      const dv = structDataView(this)
      for (let i = 0; i < resolvedByteLength; ++i) {
        result |= BigInt(dv.getUint8(resolvedOffset + i)) << BigInt(8 * i)
      }
      return BigInt.asIntN(resolvedByteLength * 8, result)
    },
    set(value) {
      const resolvedOffset = resolveNumberFieldValue(this, offset, "fieldOffset")
      const resolvedByteLength = resolvePositiveIntegerFieldValue(
        this,
        byteLength,
        "byteLength",
      )
      const dv = structDataView(this)
      for (let i = 0; i < resolvedByteLength; ++i) {
        dv.setUint8(
          resolvedOffset + i,
          Number((value >> BigInt(8 * i)) & 0xffn),
        )
      }
    },
  }
}

/**
 * Field for a little-endian 16-bit binary float (float16_t)
 */
export function f16(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  if (
    typeof DataView.prototype.getFloat16 !== "function" ||
    typeof DataView.prototype.setFloat16 !== "function"
  ) {
    throw new TypeError("float16 is not supported in this environment")
  }
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getFloat16(offset, true),
    (dv, offset, value) => dv.setFloat16(offset, value, true),
  )
}

/**
 * Field for a little-endian 32-bit binary float (float32_t)
 */
export function f32(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getFloat32(offset, true),
    (dv, offset, value) => dv.setFloat32(offset, value, true),
  )
}

/**
 * Field for a little-endian 64-bit binary float (float64_t)
 */
export function f64(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getFloat64(offset, true),
    (dv, offset, value) => dv.setFloat64(offset, value, true),
  )
}

/**
 * Field for a UTF-8 fixed-length string
 */
export function string(
  fieldOffset: NumberFieldValue,
  byteLength: NumberFieldValue,
): StructPropertyDescriptor<string> {
  const TEXT_DECODER = new TextDecoder()
  const TEXT_ENCODER = new TextEncoder()
  return {
    get() {
      const resolvedFieldOffset = resolveNumberFieldValue(
        this,
        fieldOffset,
        "fieldOffset",
      )
      const resolvedByteLength = resolveNumberFieldValue(
        this,
        byteLength,
        "byteLength",
      )
      const str = TEXT_DECODER.decode(
        structBytes(
          this,
          resolvedFieldOffset,
          resolvedFieldOffset + resolvedByteLength,
        ),
      )
      // trim all trailing null characters
      return str.replace(/\0+$/, "")
    },
    set(value) {
      const resolvedFieldOffset = resolveNumberFieldValue(
        this,
        fieldOffset,
        "fieldOffset",
      )
      const resolvedByteLength = resolveNumberFieldValue(
        this,
        byteLength,
        "byteLength",
      )
      const bytes = structBytes(
        this,
        resolvedFieldOffset,
        resolvedFieldOffset + resolvedByteLength,
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
export function bool(fieldOffset: NumberFieldValue): StructPropertyDescriptor<boolean> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => Boolean(dv.getUint8(offset)),
    (dv, offset, value) => dv.setUint8(offset, value ? 1 : 0),
  )
}

export function optional<T>(
  field: StructPropertyDescriptor<T> & { get(): T; set?: undefined },
  present:
    | BooleanFieldValue
    | {
      present: BooleanFieldValue
      setPresent?: string | ((struct: AnyStruct, present: boolean) => void)
    },
): StructPropertyDescriptor<T | undefined> & ReadOnlyAccessorDescriptor<T | undefined>
export function optional<T>(
  field: StructPropertyDescriptor<T>,
  present:
    | BooleanFieldValue
    | {
      present: BooleanFieldValue
      setPresent?: string | ((struct: AnyStruct, present: boolean) => void)
    },
): StructPropertyDescriptor<T | undefined>
export function optional<T>(
  field: StructPropertyDescriptor<T>,
  present:
    | BooleanFieldValue
    | {
      present: BooleanFieldValue
      setPresent?: string | ((struct: AnyStruct, present: boolean) => void)
    },
): StructPropertyDescriptor<T | undefined> {
  const getter = field.get
  if (typeof getter !== "function") {
    throw new TypeError(
      "optional() requires a field descriptor with a getter function",
    )
  }
  const presenceConfig = typeof present === "object"
    ? present
    : { present, setPresent: present }
  const descriptor: StructPropertyDescriptor<T | undefined> = {
    get() {
      if (!resolveBooleanFieldValue(this, presenceConfig.present)) {
        return undefined
      }
      return getter.call(this)
    },
  }
  if (typeof field.set === "function") {
    descriptor.set = function (value) {
      if (typeof value === "undefined") {
        setBooleanFieldValue(
          this,
          presenceConfig.setPresent ?? presenceConfig.present,
          false,
        )
        return
      }
      field.set?.call(this, value)
      setBooleanFieldValue(
        this,
        presenceConfig.setPresent ?? presenceConfig.present,
        true,
      )
    }
  }
  return descriptor
}

/**
 * Define a descriptor based on a dataview of the struct
 * @param fieldGetter function which, given a dataview, returns the field value
 * @param fieldSetter optional function which, given a dataview and a value, sets the field value
 * @returns an enumerable property descriptor; readonly if no setter is provided
 */
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
  byteOffset?: NumberFieldValue,
  bytelength?: OptionalNumberFieldValue,
): StructPropertyDescriptor<T> & ReadOnlyAccessorDescriptor<T> {
  return {
    get() {
      const dv = structDataView(this)
      const resolvedByteOffset = resolveOptionalNumberFieldValue(
        this,
        byteOffset,
        "byteOffset",
      ) ?? 0
      const resolvedByteLength = resolveOptionalNumberFieldValue(
        this,
        bytelength,
        "byteLength",
      ) ?? (dv.byteLength - resolvedByteOffset)
      const offset2 = dv.byteOffset + resolvedByteOffset
      const bytelength2 = resolvedByteLength
      return Reflect.construct(ctor, [{
        buffer: dv.buffer,
        byteOffset: offset2,
        byteLength: bytelength2,
      }])
    },
  }
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
  fieldOffset: NumberFieldValue,
  kwargs: {
    /** length or property name for the length of the array */
    readonly length: OptionalNumberFieldValue
    /** TypedArray constructor */
    readonly species: TypedArraySpecies<T>
  },
): StructPropertyDescriptor<T> & ReadOnlyAccessorDescriptor<T> {
  const { length, species } = kwargs
  return {
    get() {
      const dv = structDataView(this)
      const resolvedFieldOffset = resolveNumberFieldValue(
        this,
        fieldOffset,
        "fieldOffset",
      )
      let lengthValue: number | undefined
      const resolvedLength = resolveOptionalNumberFieldValue(
        this,
        length,
        "length",
      )
      if (typeof resolvedLength === "undefined") {
        lengthValue = Math.floor(
          (dv.byteLength - resolvedFieldOffset) / species.BYTES_PER_ELEMENT,
        )
      } else {
        lengthValue = resolvedLength
      }
      return new species(
        dv.buffer,
        dv.byteOffset + resolvedFieldOffset,
        lengthValue,
      )
    },
  }
}

/**
 * Field for a big-endian 16-bit unsigned integer
 */
export function u16be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getUint16(offset, false),
    (dv, offset, value) => dv.setUint16(offset, value, false),
  )
}
/**
 * Field for a big-endian 32-bit unsigned integer
 */
export function u32be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getUint32(offset, false),
    (dv, offset, value) => dv.setUint32(offset, value, false),
  )
}
/**
 * Field for a big-endian 64-bit unsigned integer
 */
export function u64be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<bigint> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getBigUint64(offset, false),
    (dv, offset, value) => dv.setBigUint64(offset, value, false),
  )
}
/**
 * Field for a big-endian 16-bit signed integer
 */
export function i16be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getInt16(offset, false),
    (dv, offset, value) => dv.setInt16(offset, value, false),
  )
}
/**
 * Field for a big-endian 32-bit signed integer
 */
export function i32be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getInt32(offset, false),
    (dv, offset, value) => dv.setInt32(offset, value, false),
  )
}
/**
 * Field for a big-endian 64-bit signed integer
 */
export function i64be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<bigint> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getBigInt64(offset, false),
    (dv, offset, value) => dv.setBigInt64(offset, value, false),
  )
}

/**
 * Field for a big-endian 16-bit binary float (float16_t)
 */
export function f16be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  if (
    typeof DataView.prototype.getFloat16 !== "function" ||
    typeof DataView.prototype.setFloat16 !== "function"
  ) {
    throw new TypeError("float16 is not supported in this environment")
  }
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getFloat16(offset, false),
    (dv, offset, value) => dv.setFloat16(offset, value, false),
  )
}

/**
 * Field for a big-endian 32-bit binary float (float32_t)
 */
export function f32be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getFloat32(offset, false),
    (dv, offset, value) => dv.setFloat32(offset, value, false),
  )
}

/**
 * Field for a big-endian 64-bit binary float (float64_t)
 */
export function f64be(fieldOffset: NumberFieldValue): StructPropertyDescriptor<number> {
  return dataViewField(
    fieldOffset,
    (dv, offset) => dv.getFloat64(offset, false),
    (dv, offset, value) => dv.setFloat64(offset, value, false),
  )
}
