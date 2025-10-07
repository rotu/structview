import {
  defineStructClass,
  f32,
  fromDataView,
  string,
  Struct,
  substruct,
  u16,
  u32,
  u64,
  u8,
} from "./mod.ts";

import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertThrows,
  fail,
} from "@std/assert";

class vec3_t extends defineStructClass({
  0: f32(0),
  1: f32(4),
  2: f32(8),
}) {
  get length() {
    return 3;
  }
  *[Symbol.iterator]() {
    yield this[0];
    yield this[1];
    yield this[2];
  }
}

Deno.test("struct has no enumerable properties", () => {
  const s = new Struct({ buffer: new ArrayBuffer() });
  for (const x in s) {
    fail(`unexpected key '${x}'`);
  }
});

Deno.test("struct", () => {
  const s = new Struct({ buffer: new ArrayBuffer(10) });
  assertInstanceOf(s, Struct);
  assertEquals(String(s), "[object Struct]");
});

Deno.test("vec3", () => {
  const bytes = new Uint8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0x28,
    0x42,
    0,
    0,
    0xc0,
    0x3f,
  ]);
  const someVec = new vec3_t(bytes);
  assert(someVec instanceof Struct);
  assertEquals(Object.getOwnPropertyNames(someVec), []);
  assertEquals(someVec[0], 0);
  assertEquals(someVec[1], 42);
  assertEquals(someVec[2], 1.5);

  // trying to add an out of bound value errors
  assertThrows(() => {
    // @ts-expect-error assignment to undeclared property
    someVec.blahbityblah = 5;
  });

  assertThrows(() => {
    // @ts-expect-error assignment to undeclared property
    someVec[3] = 5;
  });

  // can be converted to an array
  assertEquals([...someVec], [0, 42, 1.5]);

  // can be mutated
  someVec[0] = 42;
  // and mutations take
  assertEquals(someVec[0], someVec[1]);
  // mutations are propagated to the underlying buffer
  assertEquals(bytes.slice(0, 4), bytes.slice(4, 8));

  assertEquals(Object.getOwnPropertyNames(someVec), []);
});

Deno.test("string", () => {
  const Cls = defineStructClass({
    hello: string(10, 40),
  });
  const c = new Cls(new Uint8Array(60));
  assertEquals(c.hello, "");
  c.hello = "world!";
  assertEquals(c.hello, "world!");
  c.hello = "abc\0def";
  assertEquals(c.hello, "abc\0def");
});

Deno.test("substruct", () => {
  const Point2D = defineStructClass({ x: f32(0), y: f32(4) });
  const Square = defineStructClass({
    size: f32(0),
    center: substruct(Point2D, 4, 8),
  });
  const buf = new Float32Array([1, 3.5, 123]);
  const square = new Square(buf);
  assertEquals(square.size, 1);
  assertEquals(square.center.x, 3.5);
  assertEquals(square.center.y, 123);
  square.center.x = 18;
  assertEquals(buf[1], 18);
});
