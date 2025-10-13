/**
 * Helper types for this library
 * @module
 */

import type { dataViewSymbol } from "./core.ts"

export type AnyStruct = {
  readonly [dataViewSymbol]: DataView
}
// deno-lint-ignore no-explicit-any
export type Constructor<T> = { new (...args: any[]): T }

export type SubclassWithProperties<
  Ctor extends Constructor<object>,
  Mixin,
> =
  & { [K in keyof Ctor]: Ctor[K] }
  & {
    new (
      ...args: ConstructorParameters<Ctor>
    ): InstanceType<Ctor> & { [K in keyof Mixin]: Mixin[K] }
  }

export type TPropertyDescriptor<T> = {
  enumerable?: boolean
  configurable?: boolean
  get?(): T
  set?(t: T): undefined
  value?: T
  writable?: boolean
}

export type MixinFromProps<Props extends object> = {
  -readonly [K in keyof Props]: Props[K] extends TPropertyDescriptor<infer V>
    ? V
    : unknown
}

/**
 * Type of a property descriptor for a struct
 */
export type StructPropertyDescriptor<T> =
  & ThisType<AnyStruct>
  & TPropertyDescriptor<T>

export type StructConstructor<T extends object> = {
  new (arg: {
    readonly buffer: ArrayBufferLike
    readonly byteOffset: number
    readonly byteLength: number
  }): T
}
