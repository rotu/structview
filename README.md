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

# Optional and variably sized fields

The core API still favors explicit offsets for fixed binary layouts, but fields
can also resolve their offset, length, or presence from other properties. This
keeps the current API intact while making packet-style layouts possible in a
declarative way.

```js
import { bool, defineStruct, optional, string, u16, u8 } from "@rotu/structview"

class Record extends defineStruct({
  has_name: bool(0),
  name_length: u8(1),
  name: optional(string(2, "name_length"), "has_name"),
  name_end: {
    get() {
      return 2 + (this.has_name ? this.name_length : 0)
    },
  },
  checksum: u16("name_end"),
}) {}
```

`optional()` hides a field behind a boolean property or callback, and field
factories such as `string()`, `u16()`, `substruct()`, and `typedArray()` can
now resolve offsets and lengths from property names or accessor functions.

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
