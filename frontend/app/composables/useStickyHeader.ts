export const useStickyHeader = () => {
  const isTopFixed = ref(false)
  const isNavHidden = ref(false)
  let lastScrollY = 0
  let ticking = false
  let currentY = 0

  const update = () => {
    ticking = false

    if (window.innerWidth > 1024) {
      isTopFixed.value = false
      isNavHidden.value = false
      lastScrollY = currentY
      return
    }

    const y = currentY

    isTopFixed.value = y > 60

    if (y > lastScrollY && y > 80) {
      isNavHidden.value = true
    } else if (y < lastScrollY) {
      isNavHidden.value = false
    }

    lastScrollY = y
  }

  const onScroll = () => {
    currentY = window.scrollY
    if (!ticking) {
      requestAnimationFrame(update)
      ticking = true
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })

  return { isTopFixed, isNavHidden }
}
