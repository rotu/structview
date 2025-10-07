# structview

The point of this package is provide the ability to manipulate binary structured
data in a typesafe, object-oriented way.

1. Read and write binary-structured data with the same declaration
2. Single source of truth - changes to logical view are immediately reflected in
   the underlying binary structure and vice versa.
3. No separate type declarations necessary. Declaring a struct allows inference
   on instances.
4. Clean object format. No risk of your struct field names colliding with fields
   and type inference won't show excessive properties

# example

```ts
import { defineStruct, string, substruct, u8 } from "@rotu/structview"

// Structs can be inherited from like other classes
class Version extends defineStruct({
  major: u8(0),
  minor: u8(1),
  patch: u8(2),
}) {
  toString() {
    // and struct instances can be destructured like a simple javascript object
    const { major, minor, patch } = this
    return `${major}.${minor}.${patch}`
  }
}

// Or they can just be used as-is
const ProductInfo = defineStruct({
  version: substruct(Version, 0, 3),
  product: string(4, 12),
})

const bytes = new Uint8Array(16)
const info = new ProductInfo(bytes)

info.product = "Widget"
// Basic object assignment and destructuring just works
Object.assign(info.version, { major: 1, minor: 42, patch: 1 })

// Object writes are saved in the underlying buffer
console.log(
  "encoded hex:",
  bytes.map((x) => x.toString(16).padStart(2, 0)).join(""),
)

console.log(`${info.product} v${info.version}`)
console.log({ ...info })
```
