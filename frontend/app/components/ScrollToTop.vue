<script setup lang="ts">
import { buttonTranslations } from '~/locales/button'

const { currentLocale } = useLocale()
const buttonT = computed(() => buttonTranslations[currentLocale.value])
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
  window.addEventListener('scroll', checkScroll);
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll);
})
</script>

<template>
      <UButton
      v-show="isVisible"
      variant="go-to-top"
      icon="pixelarticons:chevron-up"
      :aria-label="buttonT.ariaLabelScrollToTop"
      @click="scrollToTop"
      />
</template>