<script setup lang="ts">
import { shareButtonTranslations } from '~/locales/shareButton'
import { buttonTranslations } from '~/locales/button'

const { currentLocale } = useLocale()
const { show, type, content, showNotification } = useNotification()
const route = useRoute()
const config = useRuntimeConfig()

const translations = shareButtonTranslations[currentLocale.value]

const copyLink = async () => {
  const productLink = `${config.public.siteUrl}${route.fullPath.split('?')[0]}` // Текущий URL без параметров

  try {
     await navigator.clipboard.writeText(productLink)
     showNotification(translations.successMessage)
  } catch (err) {
     console.error('Ошибка копирования:', err)
     showNotification(translations.errorMessage)
   }
}
</script>

<template>
   <div>
   <UButton
   @click="copyLink"
   icon="ph:link-simple-bold"
   name-class="share"
  :aria-label="buttonTranslations[currentLocale].ariaLabelCopyLink"
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
  transition: opacity .4s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>