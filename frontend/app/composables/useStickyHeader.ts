export const useStickyHeader = () => {
  const isTopFixed = ref(false)
  const isNavHidden = ref(false)
  const topHeight = ref(65)
  const lastScrollY = ref(0)
  const ticking = ref(false)

  const updateTopHeight = () => {
    const el = document.querySelector('.header__container-top')
    if (el) topHeight.value = el.getBoundingClientRect().height
  }

  const onScroll = () => {
    if (window.innerWidth > 1024) return
    if (!ticking.value) {
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollY.value

        isTopFixed.value = currentY > 60

        if (delta > 3 && currentY > 80) {
          isNavHidden.value = true
        } else if (delta < -3) {
          isNavHidden.value = false
        }

        if (isTopFixed.value && topHeight.value === 0) {
          updateTopHeight()
        }

        lastScrollY.value = currentY
        ticking.value = false
      })
      ticking.value = true
    }
  }

  onMounted(() => {
    updateTopHeight()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
  })

  const onResize = () => {
    if (window.innerWidth > 1024) {
      isTopFixed.value = false
      isNavHidden.value = false
    }
    updateTopHeight()
  }

  return { isTopFixed, isNavHidden, topHeight }
}
