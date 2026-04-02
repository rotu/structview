# structview

The point of this package is provide the ability to manipulate binary structured
data in a typesafe, declarative, object-oriented way.

1. Read and write binary-structured data with the same declaration
2. Single source of truth - changes to logical view are immediately reflected in
   the underlying binary structure and vice versa.
3. Written in TypeScript, written FOR JavaScript. Declaring a struct allows full
   type inference; no separate type declaration required!
4. Clean object format. No risk of your struct field names colliding with
   implementation details. Type inference won't show excessive properties.

[![JSR Version](https://img.shields.io/jsr/v/@rotu/structview)](https://jsr.io/@rotu/structview)
[![NPM Version](https://img.shields.io/npm/v/@rotu/structview)](https://www.npmjs.com/package/@rotu/structview)

# Development

Contributor workflow notes, local commands, hooks, and release steps live in
`AGENTS.md`.

# example

This example is pure JavaScript, but note that all property access is fully
typechecked.

```js
import {
  defineArray,
  defineStruct,
  f32,
  string,
  substruct,
  u8,
} from "@rotu/structview"

// defineStruct returns a new class, which can be extended with custom getters, setters, and methods.
// It's recommended to always extend even if you have no additional members, so your class has a name and so the declaration is hoisted.
class Version extends defineStruct({
  major: u8(0),
  minor: u8(1),
  patch: u8(2),
}) {
  asString() {
    // Struct fields are exposed as properties. They can be destructured like any other js object
    const { major, minor, patch } = this
    return `${major}.${minor}.${patch}`
  }
}

class ProductInfo extends defineStruct({
  version: substruct(Version, 0, 3),
  product: string(4, 12),
}) {}

const bytes = new Uint8Array(16)
const info = new ProductInfo(bytes)

info.product = "Widget"
// Basic object assignment and destructuring just works
Object.assign(info.version, { major: 1, minor: 42, patch: 1 })

// Object writes are saved in the underlying buffer
console.log(
  "encoded hex:",
  bytes.toHex(),
)

console.log(`${info.product} v${info.version.asString()}`)

// You can compose structs into arrays
class Dish extends defineStruct({
  price: f32(0),
  name: string(4, 12),
}) {}

class Menu extends defineArray({
  struct: Dish,
  byteStride: 16,
  length: 3,
}) {}

const myMenu = Menu.alloc({ byteLength: 48 })
Object.assign(myMenu.item(0), { name: "garden salad", price: 4 })
Object.assign(myMenu.item(1), { name: "soup du jour", price: 2.5 })
Object.assign(myMenu.item(2), { name: "fries", price: 2.25 })

// and arrays are iterable
for (const dish of myMenu) {
  console.log(`${dish.name} costs \$${dish.price}`)
}
```

# Gotchas and rough edges

1. Resizable structs are not yet implemented. Resizable `Arraybuffer`s only
   allow you to add or remove bytes at the end which is not the best experience.
   You can still create a `Struct` on top of a resizable `ArrayBuffer` at your
   own risk.
2. Struct fields have a byte offset specified in bytes from the beginning of the
   declaring struct. This is a bit verbose but is a deliberate choice.
   - It prevents changes to the struct from accidentally changing other fields
   - It implicitly allows C-style `union`s for free.
   - Different languages and compilers have different expectations for alignment
     and spacing of fields.
3. Be careful using `TypedArray`s. They have an alignment requirement relative
   to their underlying `ArrayBuffer`.
4. `Struct` classes define properties on the prototype, _not_ on the instance.
   That means spread syntax (`x = {...s}`) and `JSON.stringify(s)` will _not_
   reflect inherited fields.

# Optional and variable-length fields

## Optional fields — `optional(descriptor, presence)`

Wrap any field descriptor with `optional()` to make it return `null` when the
field is absent.  Two presence strategies are supported:

### Sentinel value

A field is absent when its stored value equals the sentinel (compared via
`Object.is`).  Writing `null` stores the sentinel.

```js
import { defineStruct, optional, u16, u32 } from "@rotu/structview"

// 0xFFFF is the conventional "not present" marker for a u16
const Msg = defineStruct({
  id:    u16(0),
  extra: optional(u32(4), { sentinel: 0xffffffff }),
})

const msg = Msg.alloc({ byteLength: 8 })
msg.id = 1
msg.extra = null        // writes 0xffffffff into bytes 4-7
console.log(msg.extra)  // → null

msg.extra = 99
console.log(msg.extra)  // → 99
```

### Predicate function

A field is absent when a `(dv: DataView) => boolean` function returns `false`.
Setting to `null` is a no-op; the presence flag must be managed separately.

```js
const Packet = defineStruct({
  flags:   u8(0),
  payload: optional(u32(4), (dv) => (dv.getUint8(0) & 0x01) !== 0),
})

const pkt = Packet.alloc({ byteLength: 8 })
console.log(pkt.payload)  // → null (flag bit not set)

pkt.flags = 1
pkt.payload = 42
console.log(pkt.payload)  // → 42
```

The returned descriptor is **writable when the wrapped descriptor is writable**,
and **read-only when the wrapped descriptor is read-only** (e.g. `substruct`,
`typedArray`, or `fromDataView` without a setter).

## Variable-length strings — `string(offset, { length })`

Pass an options object as the second argument to create a **read-only**
variable-length string field.  The byte length can be a property name on the
struct or a function of the `DataView`.

```js
import { defineStruct, string, u8 } from "@rotu/structview"

const Frame = defineStruct({
  name_len: u8(0),
  // byte length is read from the `name_len` field at access time
  name: string(1, { length: "name_len" }),
})
```

Or with a function:

```js
const Frame = defineStruct({
  name: string(1, { length: (dv) => dv.getUint8(0) }),
})
```

> **Note:** Variable-length string fields are read-only.  To write a
> variable-length string, update the backing buffer directly (e.g. via a
> `typedArray` or `fromDataView` with a custom setter).

## Variable-length typed arrays — `typedArray(offset, { species, length })`

The existing `typedArray` helper already supports a numeric length and a
property-name length.  It now also accepts a `(dv: DataView) => number`
function:

```js
import { defineStruct, typedArray, u8 } from "@rotu/structview"

const Blob = defineStruct({
  count:  u8(0),
  values: typedArray(4, {
    species: Float32Array,
    length:  (dv) => dv.getUint8(0),
  }),
})

const blob = Blob.alloc({ byteLength: 20 })
blob.count = 3
blob.values[0] = 1.5
blob.values[1] = 2.5
blob.values[2] = 3.5
```

