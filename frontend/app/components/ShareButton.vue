<script setup lang="ts">
import { shareButtonTranslations } from '~/locales/shareButton'
import { buttonTranslations } from '~/locales/button'

const { currentLocale } = useLocale()
const t = computed(() => shareButtonTranslations[currentLocale.value])
const buttonT = computed(() => buttonTranslations[currentLocale.value])
const { show, type, content, showNotification } = useNotification()
const route = useRoute()
const config = useRuntimeConfig()

const copyLink = async () => {
  const productLink = `${config.public.siteUrl}${route.fullPath.split('?')[0]}` // Текущий URL без параметров

  try {
     await navigator.clipboard.writeText(productLink)
      showNotification(t.value.successMessage)
   } catch (err) {
      console.error('Ошибка копирования:', err)
      showNotification(t.value.errorMessage)
   }
}
</script>

<template>
   <div>
   <UButton
   icon="ph:link-simple-bold"
   variant="share"
   :aria-label="buttonT.ariaLabelCopyLink"
  @click="copyLink"
   />

   <Transition name="fade">
   <AppNotification
      v-if="show"
      :type="type"
      @close="show = false"
    >
      {{ content }}
    </AppNotification>
    </Transition>
   </div>
</template>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>