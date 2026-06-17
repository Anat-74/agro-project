import { describe, it, expect } from "vitest"
import { useDebounce } from "../useDebounce"

describe("useDebounce", () => {
  it("returns a function", () => {
    const debounced = useDebounce(() => {}, 300)
    expect(typeof debounced).toBe("function")
  })
  it("has cancel method", () => {
    const debounced = useDebounce(() => {}, 300)
    expect(typeof debounced.cancel).toBe("function")
  })
})
