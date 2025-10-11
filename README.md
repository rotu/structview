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

[![JSR](https://jsr.io/badges/@rotu/structview)](https://jsr.io/@rotu/structview)

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

// defineStruct returns a new class, which can be extended with custom getters, setters, and methods
// it's recommended to always extend even if you have no additional members, so you can benefit from declaration hoisting.
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

const myMenu = new Menu({ byteLength: 48 })
Object.assign(myMenu.element(0), { name: "garden salad", price: 4 })
Object.assign(myMenu.element(1), { name: "soup du jour", price: 2.5 })
Object.assign(myMenu.element(2), { name: "fries", price: 2.25 })

// and arrays are iterable
for (const dish of myMenu) {
  console.log(`${dish.name} costs \$${dish.price}`)
}
```
