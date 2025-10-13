import { structDataView, type StructPropertyDescriptor } from "@rotu/structview"

export function biguintle(
  offset: number,
  { byteLength }: { byteLength: number },
): StructPropertyDescriptor<bigint> {
  return {
    get() {
      let result = 0n
      const dv = structDataView(this)
      for (let i = 0; i < byteLength; ++i) {
        result |= BigInt(dv.getUint8(offset + i)) << BigInt(8 * i)
      }
      return result
    },
    set(value) {
      const dv = structDataView(this)
      for (let i = 0; i < byteLength; ++i) {
        dv.setUint8(
          offset + i,
          Number((value >> BigInt(8 * i)) & 0xffn),
        )
      }
    },
  }
}

export function bigintle(
  offset: number,
  options: { byteLength: number },
): StructPropertyDescriptor<bigint> {
  const { byteLength } = options
  return {
    get() {
      let result = 0n
      const dv = structDataView(this)
      for (let i = 0; i < byteLength; ++i) {
        result |= BigInt(dv.getUint8(offset + i)) << BigInt(8 * i)
      }
      return BigInt.asIntN(byteLength * 8, result)
    },
    set(value) {
      const dv = structDataView(this)
      for (let i = 0; i < byteLength; ++i) {
        dv.setUint8(
          offset + i,
          Number((value >> BigInt(8 * i)) & 0xffn),
        )
      }
    },
  }
}
