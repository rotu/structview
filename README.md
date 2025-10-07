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
