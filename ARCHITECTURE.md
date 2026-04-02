# Architecture

This document explains the key design decisions behind structview and the
trade-offs considered.

## Why property descriptors?

structview uses `Object.defineProperties()` on the prototype to expose binary
fields as getter/setter pairs. Each field factory (`u8`, `f32`, `string`, …)
returns a standard `PropertyDescriptor`, and `defineStruct()` installs them on
an anonymous subclass of `Struct`.

Alternatives considered:

### Proxy-based approach

A `Proxy` wrapper could intercept property access and dispatch to the underlying
`DataView`. This would make `{...struct}` and `Object.keys()` work transparently
because the proxy's `ownKeys` / `getOwnPropertyDescriptor` traps can advertise
the fields as own properties.

Downsides:

- **Performance.** Proxy property access is roughly 5–10× slower than a
  prototype getter in V8. For a library whose main value proposition is
  zero-copy views of binary data, this is a significant tax.
- **TypeScript ergonomics.** Typing a Proxy so that each field has the correct
  type requires mapped-type gymnastics and loses IntelliSense features like
  "Go to Definition" on individual fields.
- **Class integration.** Proxies don't compose naturally with `class` syntax,
  `instanceof`, or `super`. Users couldn't subclass a struct to add domain
  methods without additional boilerplate.
- **Identity.** A proxy wrapping a plain target object complicates `===`
  comparisons and WeakMap keying.

### Instance descriptors (defineProperty on each instance)

Instead of sharing descriptors on the prototype, each constructor call could
install them on the instance. That would make `{...struct}` work because spread
only copies own properties.

Downsides:

- **Memory.** Every instance allocates its own set of descriptor objects.
  For struct arrays with thousands of elements, this adds significant GC
  pressure.
- **Startup cost.** `Object.defineProperties` on each instance is measurably
  slower than a single prototype setup.

### Conclusion

Prototype property descriptors offer the best balance of performance, memory
efficiency, TypeScript inference, and composability with the class system.
The main ergonomic gap—`JSON.stringify()` and spread not reflecting inherited
fields—is addressed by providing a `toJSON()` method on `Struct`.

## What was done well

1. **Symbol-keyed internal state.** The `DataView` backing store lives behind
   `Symbol.for("Struct.dataview")`, so user field names never collide with
   internal bookkeeping.
2. **Composable field factories.** Each factory (`u8`, `f32`, `string`, …) is a
   pure function returning a standard descriptor. Users can write their own
   factories (via `fromDataView`) without touching library internals.
3. **TypeScript integration.** `defineStruct` preserves full type inference—
   field types, readonly inference for getter-only descriptors, and constructor
   signatures—without requiring separate type declarations.
4. **Zero-copy views.** Struct instances and substructs share the same
   `ArrayBuffer`. Mutations are immediately visible across all views.

## What was improved

1. **`toJSON()` on `Struct`.** `JSON.stringify(struct)` now works as expected,
   serializing all enumerable inherited fields. Nested substructs serialize
   recursively.
2. **Gotcha documentation.** The README gotcha about spread/JSON has been updated
   to note that `JSON.stringify` now works via `toJSON()`, while spread syntax
   still requires a manual `Object.assign({}, ...)` pattern.

## Remaining limitations

- **Spread syntax** (`{...struct}`) still copies only own enumerable properties.
  Since fields live on the prototype, spread produces an empty object. Use
  `struct.toJSON()` to obtain a plain-object snapshot, or
  `Object.assign({}, struct.toJSON())` if you need a spreadable copy.
- **`structuredClone()`** does not invoke `toJSON()` and will not preserve field
  values. Clone the underlying buffer instead.
