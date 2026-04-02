// Minimal compatibility shim for @std/assert using node:assert.
//
// This file provides the assertion functions used in the test suite without
// requiring network access to jsr.io. It is a local drop-in for the JSR
// package @std/assert when that registry is not reachable (e.g. in
// network-restricted CI environments running under `act`).
//
// Runtime requirements: Deno 2.x (which has built-in Node.js compatibility
// via the node: URL scheme) or any Node.js runtime.
//
// The shim covers only the functions actually imported by the project's tests.
// Error messages are plain-text (no colored diffs), but pass/fail behavior is
// identical to the real package.

import nodeAssert from "node:assert/strict"

export class AssertionError extends nodeAssert.AssertionError {
  constructor(message: string) {
    super({ message })
  }
}

export function assert(value: unknown, msg?: string): asserts value {
  nodeAssert.ok(value, msg)
}

export function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  nodeAssert.deepStrictEqual(actual, expected, msg)
}

export function assertNotEquals<T>(
  actual: T,
  expected: T,
  msg?: string,
): void {
  nodeAssert.notDeepStrictEqual(actual, expected, msg)
}

export function assertStrictEquals<T>(
  actual: unknown,
  expected: T,
  msg?: string,
): asserts actual is T {
  nodeAssert.strictEqual(actual, expected, msg)
}

export function assertInstanceOf<T>(
  actual: unknown,
  // deno-lint-ignore no-explicit-any
  expectedType: new (...args: any[]) => T,
  msg?: string,
): asserts actual is T {
  nodeAssert.ok(
    actual instanceof expectedType,
    msg ??
      `Expected value to be an instance of "${expectedType.name}", got "${
        (actual as object)?.constructor?.name ?? typeof actual
      }" instead`,
  )
}

export function assertThrows(
  fn: () => unknown,
  // deno-lint-ignore no-explicit-any
  errorClassOrMsg?: (new (...args: any[]) => Error) | string,
  msgIncludes?: string,
  msg?: string,
): Error {
  let threw = false
  let caughtError: Error | undefined
  try {
    fn()
  } catch (e) {
    threw = true
    caughtError = e instanceof Error ? e : new Error(String(e))
  }
  if (!threw) {
    nodeAssert.fail(msg ?? "Expected function to throw, but it did not.")
  }
  if (typeof errorClassOrMsg === "function") {
    nodeAssert.ok(
      caughtError instanceof errorClassOrMsg,
      msg ??
        `Expected error to be instance of "${errorClassOrMsg.name}", got "${caughtError?.constructor?.name}"`,
    )
  } else if (typeof errorClassOrMsg === "string") {
    // errorClassOrMsg is a message substring to check
    nodeAssert.ok(
      caughtError?.message.includes(errorClassOrMsg),
      msg ??
        `Expected error message to include "${errorClassOrMsg}", got: "${caughtError?.message}"`,
    )
  }
  if (msgIncludes !== undefined) {
    nodeAssert.ok(
      caughtError?.message.includes(msgIncludes),
      msg ??
        `Expected error message to include "${msgIncludes}", got: "${caughtError?.message}"`,
    )
  }
  return caughtError!
}

export function fail(msg?: string): never {
  nodeAssert.fail(msg)
}
