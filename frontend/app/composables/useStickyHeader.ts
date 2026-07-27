export const useStickyHeader = () => {
  const isNavHidden = ref(false)
  let lastScrollY = 0
  let ticking = false
  let currentY = 0

  const update = () => {
    ticking = false

    if (window.innerWidth > 1024) {
      isNavHidden.value = false
      lastScrollY = currentY
      return
    }

    const y = currentY

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

  return { isNavHidden }
}
