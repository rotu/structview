import { expect, test } from "vitest"

test("workers runtime globals are available", () => {
  expect(Reflect.has(globalThis as object, "WebSocketPair")).toBe(true)

  const cachesObject = Reflect.get(globalThis as object, "caches")
  expect(cachesObject).toBeDefined()

  const defaultCache = Reflect.get(cachesObject as object, "default")
  expect(defaultCache).toBeDefined()
  expect(typeof Reflect.get(defaultCache as object, "match")).toBe("function")
})
