<script setup lang="ts">
import { buttonTranslations } from '~/locales/button'

const { currentLocale } = useLocale()
const isVisible = ref(false)

const checkScroll = () => {
  isVisible.value = window.scrollY > 1000
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', checkScroll);
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', checkScroll);
  }
})
</script>

<template>
      <UButton
      @click="scrollToTop"
      v-show="isVisible"
      name-class="go-to-top"
      icon="pixelarticons:chevron-up"
      :aria-label="buttonTranslations[currentLocale].ariaLabelScrollToTop"
      />
</template>