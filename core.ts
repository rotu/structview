/**
 * Tools for declaring a binary struct as a class with properties
 * @module
 */

import type {
  AnyStruct,
  Constructor,
  MixinFromProps,
  StructConstructor,
  SubclassWithProperties,
} from "./types.ts"

export const dataViewSymbol = Symbol.for("Struct.dataview")

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
export function structBytes(
  struct: AnyStruct,
  start?: number,
  end?: number,
): Uint8Array {
  const dv = structDataView(struct)
  start ??= 0
  end ??= dv.byteLength
  console.assert(start <= end)
  console.assert(end <= dv.byteLength)
  return new Uint8Array(dv.buffer, dv.byteOffset + start, end - start)
}

/**
 * Base class for a structured binary object
 * Note there are no predeclared string-keyed properties - all property names are reserved for user-defined fields
 */
export class Struct {
  [dataViewSymbol]: DataView

  /**
   * Create a new instance of this Struct in a newly allocated buffer
   * @param args options for allocation. Note that if the class does not have a static BYTE_LENGTH property, you *must* provide a byteLength here.
   * @returns
   */
  static alloc<T extends Struct>(
    this: { new ({ buffer }: { readonly buffer: ArrayBufferLike }): T },
    args?: { byteLength?: number; maxByteLength?: number },
  ): T {
    const byteLength = args?.byteLength ?? Reflect.get(this, "BYTE_LENGTH")
    const maxByteLength = args?.maxByteLength ??
      Reflect.get(this, "MAX_BYTE_LENGTH")

    if (typeof byteLength !== "number") {
      throw new TypeError(
        "Cannot allocate struct - its class must have a static BYTE_LENGTH property",
      )
    }
    const buffer = new ArrayBuffer(byteLength, { maxByteLength })
    return new this({ buffer })
  }

  get [Symbol.toStringTag](): string {
    return Struct.name
  }

  static toDataView(o: Struct): DataView {
    return o[dataViewSymbol]
  }

  static [Symbol.hasInstance](instance: unknown): boolean {
    return (
      typeof instance === "object" &&
      instance !== null &&
      dataViewSymbol in instance
    )
  }

  /**
   * Create a new Struct
   * @param arg options for creating the struct.
   *  If options has a `.buffer` property, we will use that as the backing memory (e.g. any TypedArray or DataView).
   *  If options has no `.buffer` property but has a `.byteLength`, we will allocate a new buffer for the object.
   * @remarks
   * The reason we don't use a positional argument for `byteLength` is because it's confusing - TypedArray constructors take a `length` argument that is in elements, not bytes.
   * Another reason is because this allows you to pass in a `DataView` or a `TypedArray` directly to reinterpret its memory as a struct.
   *
   * Instead of passing an undefined `buffer` property, consider using the `.alloc` static method. */
  constructor(
    arg:
      | {
        readonly buffer: ArrayBufferLike
        readonly byteOffset?: number
        readonly byteLength?: number
      }
      | {
        readonly buffer?: undefined
        readonly byteOffset?: number
        readonly byteLength: number
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
  const Ctor extends Constructor<object>,
  const Props extends PropertyDescriptorMap,
>(
  ctor: Ctor,
  propertyDescriptors: Props,
): SubclassWithProperties<Ctor, MixinFromProps<Props>> {
  return (class extends ctor {
    static {
      Object.defineProperties(this.prototype, propertyDescriptors)
    }
  }) as SubclassWithProperties<Ctor, MixinFromProps<Props>>
}

/**
 * Subclass struct by adding the given property descriptors
 * @param propertyDescriptors properties to add to subclass instances.
 *   If enumerable is not specified, it will default to true.
 * @returns A new class, inheriting from `Struct`, with the new property descriptors added
 */
export function defineStruct<const Props extends PropertyDescriptorMap>(
  propertyDescriptors: Props,
): SubclassWithProperties<typeof Struct, MixinFromProps<Props>> {
  function defaultEnumerable(descriptor: PropertyDescriptor) {
    return Object.create(descriptor, {
      enumerable: { value: descriptor.enumerable ?? true },
    })
  }
  const newDescriptorEntries = Object.entries(propertyDescriptors).map(
    (
      [name, value],
    ) => [
      name,
      defaultEnumerable(value),
    ],
  )
  const newDescriptors = Object.fromEntries(
    newDescriptorEntries,
  ) as Props

  return subclassWithProperties(Struct, newDescriptors)
}

/**
 * Create a new struct subclass for an array of structs
 * @param arrayOptions
 * @returns A new class, inheriting from `Struct` whose elements are statically typed structs
 */
export function defineArray<Item extends object>(
  arrayOptions: {
    /** Constructor for an object view of each item */
    readonly struct: StructConstructor<Item>
    /** Number of bytes between the start of consecutive items */
    readonly byteStride: number
    /** Total number of items in the array (not bytes). If omitted, the array length will depend on the size of its underlying buffer */
    readonly length?: number
  },
): StructConstructor<
  {
    readonly length: number
    item(i: number): Item
  } & Iterable<Item>
> {
  const { struct, byteStride, length } = arrayOptions

  /**
   * Class representing an array of structs.
   */
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
     * @remarks
     * Items are gettable but not settable. It is assumed that you will mutate the struct in place.
     */
    item(index: number): Item {
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
  return StructArray
}
