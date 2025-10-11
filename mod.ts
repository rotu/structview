/**
 * Strongly typed classes for accessing binary data in a structured way
 * @module
 */

const dataViewSymbol = Symbol.for("Struct.dataview")
type AnyStruct = {
  readonly [dataViewSymbol]: DataView
}
// deno-lint-ignore no-explicit-any
type Constructor<T> = { new (...args: any[]): T }
// deno-lint-ignore no-explicit-any
type AnyConstructor = Constructor<any>

type SubclassWithProperties<
  Ctor extends Constructor<object>,
  Mixin,
> =
  & { [K in keyof Ctor]: Ctor[K] }
  & {
    new (
      ...args: ConstructorParameters<Ctor>
    ): InstanceType<Ctor> & { -readonly [K in keyof Mixin]: Mixin[K] }
  }

type TPropertyDescriptor<T> = {
  enumerable?: boolean
  configurable?: boolean
  get?(): T
  set?(t: T): undefined
  value?: T
  writable?: boolean
}

type MixinFromProps<Props extends object> = {
  [K in keyof Props]: Props[K] extends TPropertyDescriptor<infer V> ? V
    : unknown
}

/**
 * Get the underlying DataView of a struct
 * @param struct
 * @returns
 */
export function structDataView(struct: AnyStruct): DataView {
  const result = struct[dataViewSymbol]
  if (!(result instanceof DataView)) {
    throw new TypeError("not a struct")
  }
  return struct[dataViewSymbol]
}
/**
 * Helper method to create a view of a contiguous subregion of a Struct's memory
 * @param struct
 * @param start byte offset to start
 * @param end byte offset of the end of the subrange
 * @returns region of the given struct.
 */
function structBytes(struct: AnyStruct, start?: number, end?: number) {
  const dv = structDataView(struct)
  start ??= 0
  end ??= dv.byteLength
  console.assert(start <= end)
  console.assert(end <= dv.byteLength)
  return new Uint8Array(dv.buffer, dv.byteOffset + start, end - start)
}

/**
 * Type of a property descriptor for a struct
 */
export type StructPropertyDescriptor<T> =
  & ThisType<AnyStruct>
  & TPropertyDescriptor<T>

/**
 * Define a descriptor based on a dataview of the struct
 * @param fieldGetter function which, given a dataview, returns
 * @returns
 */
export function fromDataView<Fn extends (dv: DataView) => unknown>(
  fieldGetter: Fn,
): StructPropertyDescriptor<ReturnType<Fn>> {
  return {
    enumerable: true,
    get() {
      const dv = this[dataViewSymbol]
      return fieldGetter(dv)
    },
  } as ThisType<Struct>
}

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

type StructConstructor<T extends object> = {
  new (arg: {
    buffer: ArrayBufferLike
    byteOffset?: number
    byteLength?: number
  }): T
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
 * Base class for a structured binary object
 * Note there are no predeclared string-keyed properties - all property names are reserved for user-defined fields
 */
export class Struct {
  [dataViewSymbol]: DataView
  get [Symbol.toStringTag](): string {
    return Struct.name
  }
  static toDataView(o: Struct): DataView {
    return o[dataViewSymbol]
  }

  /**
   * Create a new Struct
   * @param arg options for creating the struct.
   *  If options has a `.buffer` property, we will use that as the backing memory (e.g. any TypedArray or DataView).
   *  If options has no `.buffer` property but has a `.byteLength`, we will allocate a new buffer for the object.
   */
  constructor(
    arg:
      | {
        buffer: ArrayBufferLike
        byteOffset?: number
        byteLength?: number
      }
      | {
        buffer?: undefined
        byteOffset?: number
        byteLength: number
      },
  ) {
    if (typeof arg !== "object" || arg === null) {
      throw new TypeError("Expected argument to be an object")
    }

    Object.preventExtensions(this)
    if (arg.buffer) {
      this[dataViewSymbol] = new DataView(
        arg.buffer,
        arg.byteOffset,
        arg.byteLength,
      )
    } else if (typeof arg.byteLength === "number") {
      this[dataViewSymbol] = new DataView(
        new ArrayBuffer(arg.byteLength + (arg.byteOffset ?? 0)),
        arg.byteOffset,
        arg.byteLength,
      )
    } else {
      throw new TypeError(
        "Must provide either {buffer} or {byteLength}",
      )
    }
  }
}

/**
 * Subclass a type by adding the given property descriptors
 * @param ctor constructor for the base class
 * @param propertyDescriptors properties to add to subclass instances
 * @returns A new class, inheriting from the base class, with the new property descriptors added
 */
function subclassWithProperties<
  const Ctor extends AnyConstructor,
  const Props extends PropertyDescriptorMap,
>(
  ctor: Ctor,
  propertyDescriptors: Props,
): SubclassWithProperties<Ctor, MixinFromProps<Props>> {
  return (class extends ctor {
    static {
      Object.defineProperties(this.prototype, propertyDescriptors)
    }
  })
}

/**
 * Subclass struct by adding the given property descriptors
 * @param propertyDescriptors properties to add to subclass instances
 * @returns A new class, inheriting from `Struct`, with the new property descriptors added
 */
export function defineStruct<const Props extends PropertyDescriptorMap>(
  propertyDescriptors: Props,
): SubclassWithProperties<typeof Struct, MixinFromProps<Props>> {
  return subclassWithProperties(Struct, propertyDescriptors)
}

/**
 * Create a new struct subclass for an array of structs
 * @param arrayOptions
 * @returns A new class, inheriting from `Struct` whose elements are statically typed structs
 */
export function defineArray<Ctor extends StructConstructor<object>>(
  arrayOptions: {
    /** Constructor for an object view of each item */
    struct: Ctor
    /** Number of bytes between the start of consecutive items */
    byteStride: number
    /** Total number of items in the array (not bytes). If omitted, the array length will depend on the size of its underlying buffer */
    length?: number
  },
): StructConstructor<
  {
    readonly length: number
    element(i: number): InstanceType<Ctor>
  } & Iterable<InstanceType<Ctor>>
> {
  const { struct, byteStride, length } = arrayOptions

  class StructArray extends Struct {
    #struct = struct
    #length = length
    #byteStride = byteStride

    /**
     * Number of items in the array
     */
    get length() {
      if (typeof this.#length === "number") {
        return this.#length
      }
      return structDataView(this).byteLength / this.#byteStride
    }

    /**
     * A view of the item at the given index
     * @param index
     * @returns a new struct instance viewing the item at the given index
     */
    item(index: number) {
      const ctor = this.#struct
      return new ctor(
        structBytes(
          this,
          this.#byteStride * index,
          this.#byteStride * (index + 1),
        ),
      )
    }
    /** @deprecated use item() instead */
    element(index: number) {
      return this.item(index)
    }
    /**
     * Iterate over the items in the array
     */
    *[Symbol.iterator]() {
      for (let i = 0; i < this.length; ++i) {
        yield this.item(i)
      }
    }
  }
  // deno-lint-ignore no-explicit-any
  return StructArray as any
}
