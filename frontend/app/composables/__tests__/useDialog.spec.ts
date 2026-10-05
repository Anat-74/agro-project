import { describe, it, expect } from "vitest"
// Re-register composable with explicit Vue imports for test env
const { useDialog } = await import("../useDialogState")

describe("useDialog", () => {
  it("returns isOpen ref when called without element", () => {
    const { isOpen } = useDialog("test-id")
    expect(isOpen.value).toBe(false)
  })

  it("shares isOpen state for same id", () => {
    const { isOpen: a } = useDialog("shared")
    const { isOpen: b } = useDialog("shared")
    // useState возвращает разные ref-обёртки на один ключ, но состояние общее
    a.value = true
    expect(b.value).toBe(true)
  })
})
