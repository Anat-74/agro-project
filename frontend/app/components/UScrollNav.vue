<script setup lang="ts">
import { buttonTranslations } from '~/locales/button'

/**
 * Кнопка навигации по скроллу (бывший ScrollToTop, расширен).
 *
 * - mode="up"     — только «наверх» (окно/подвал): видна после threshold px.
 * - mode="toggle" — панель фильтров: пока можно листать вниз → шеврон вниз
 *                   (тап скроллит на высоту экрана), у низа → переворачивается
 *                   вверх (тап — на самый верх контейнера).
 *
 * target — контейнер прокрутки (по умолчанию window).
 */
interface Props {
  target?: HTMLElement | null
  mode?: 'up' | 'toggle'
  threshold?: number
  variant?: string
  iconDown?: string
  iconUp?: string
}

const {
  target = null,
  mode = 'up',
  threshold = 2200,
  variant = 'go-to-top',
  iconDown = 'mdi:chevron-double-down',
  iconUp = 'pixelarticons:chevron-up',
} = defineProps<Props>()

const { currentLocale } = useLocale()
const buttonT = computed(() => buttonTranslations[currentLocale.value])

const isVisible = ref(false)
const atBottom = ref(false)

const update = () => {
  if (mode === 'up') {
    const top = target ? target.scrollTop : window.scrollY
    isVisible.value = top > threshold
    return
  }
  if (!target) return
  const max = target.scrollHeight - target.clientHeight
  isVisible.value = max > 2
  atBottom.value = target.scrollTop >= max - 2
}

const scrollTo = (top: number) => {
  if (target) target.scrollTo({ top, behavior: 'smooth' })
  else window.scrollTo({ top, behavior: 'smooth' })
}

const onClick = () => {
  if (mode === 'up' || !target) {
    scrollTo(0)
    return
  }
  // Вниз — на высоту видимой области; у низа — наверх контейнера
  if (atBottom.value) scrollTo(0)
  else scrollTo(Math.min(target.scrollTop + target.clientHeight, target.scrollHeight))
}

const addScroll = (fn: () => void) => {
  const opt = { passive: true } as AddEventListenerOptions
  if (target) target.addEventListener('scroll', fn, opt)
  else window.addEventListener('scroll', fn, opt)
}
const removeScroll = (fn: () => void) => {
  if (target) target.removeEventListener('scroll', fn)
  else window.removeEventListener('scroll', fn)
}

let resizeObserver: ResizeObserver | null = null
const onResize = () => update()

const bind = () => {
  addScroll(update)
  window.addEventListener('resize', onResize)
  if (target && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(target)
  }
  update()
}

const unbind = () => {
  removeScroll(update)
  window.removeEventListener('resize', onResize)
  resizeObserver?.disconnect()
  resizeObserver = null
}

const currentIcon = computed(() => {
  if (mode === 'toggle') return atBottom.value ? iconUp : iconDown
  return iconUp
})

const currentLabel = computed(() =>
  mode === 'toggle' && atBottom.value ? buttonT.value.ariaLabelScrollToTop : buttonT.value.ariaLabelScrollDown,
)

onMounted(() => {
  if (mode === 'up' || target) bind()
})

watch(
  () => target,
  () => {
    unbind()
    if (mode === 'up' || target) bind()
  },
)

onUnmounted(unbind)
</script>

<template>
  <UButton
    v-show="isVisible"
    :variant="variant"
    :icon="currentIcon"
    :aria-label="currentLabel"
    @click="onClick"
  />
</template>
