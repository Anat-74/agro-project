export const useViewport = () => {
  const width = ref(0)

  const updateWidth = () => {
    if (import.meta.client) {
      width.value = window.innerWidth
    }
  }

  onMounted(() => {
    updateWidth()
    window.addEventListener('resize', updateWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth)
  })

  return { width }
}