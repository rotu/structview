/** @file Helper types for this library */

import type { dataViewSymbol } from "./core.ts"

export type AnyStruct = { readonly [dataViewSymbol]: DataView }
export type Constructor<T> = { new (...args: any[]): T }

export type SubclassWithProperties<Ctor extends Constructor<object>, Mixin> = {
  [K in keyof Ctor]: Ctor[K]
} & {
  new (...args: ConstructorParameters<Ctor>): InstanceType<Ctor> & { [K in keyof Mixin]: Mixin[K] }
}

export type TPropertyDescriptor<T> = {
  enumerable?: boolean
  configurable?: boolean
  get?(): T
  set?(t: T): undefined
  value?: T
  writable?: boolean
}

/** Object type that would result from Object.defineProperties({}, p:Props) */
export type MixinFromProps<Props extends object> = {
  +readonly [K in keyof Props as Props[K] extends ReadOnlyAccessorDescriptor<unknown>
    ? K
    : never]: Props[K] extends TPropertyDescriptor<infer V> ? V : unknown
} & {
  -readonly [K in keyof Props as Props[K] extends ReadOnlyAccessorDescriptor<unknown>
    ? never
    : K]: Props[K] extends TPropertyDescriptor<infer V> ? V : unknown
}

/** Type of a property descriptor for a struct */
export type StructPropertyDescriptor<T> = ThisType<AnyStruct> & TPropertyDescriptor<T>

export type ReadOnlyAccessorDescriptor<T> = { get(): T; set?: undefined }

export type StructConstructor<T extends object> = {
  new (arg: {
    readonly buffer: ArrayBufferLike
    readonly byteOffset: number
    readonly byteLength: number
  }): T
}

/** Type of a TypedArray subclass constructor */
export type TypedArraySpecies<T> = {
  new (buffer: ArrayBufferLike, byteOffset?: number, length?: number): T
  readonly BYTES_PER_ELEMENT: number
}
