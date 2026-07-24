export const useStickyHeader = () => {
  const isTopFixed = ref(false)
  const isNavHidden = ref(false)
  let lastScrollY = 0

  const onResize = () => {
    if (window.innerWidth > 1024) {
      isTopFixed.value = false
      isNavHidden.value = false
    }
  }

  const onScroll = () => {
    if (window.innerWidth > 1024) return
    const y = window.scrollY
    if (y > 60) isTopFixed.value = true
    if (y === 0) isTopFixed.value = false
    if (y > lastScrollY && y > 80) {
      isNavHidden.value = true
    } else if (y < lastScrollY) {
      isNavHidden.value = false
    }
    lastScrollY = y
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
  })

  return { isTopFixed, isNavHidden }
}
