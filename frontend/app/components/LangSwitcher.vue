<script setup>
import { buttonTranslations } from '~/locales/button'

const { currentLocale, locales, switchLocale } = useLocale()

// Безопасный доступ к переводам
const getButtonTranslation = (locale) => {
  return buttonTranslations[locale] || buttonTranslations.ru
}
</script>

<template>
  <div class="lang-switcher">
    <UButton
      v-for="locale in locales"
      :key="locale.code"
      variant="lang-switcher"
      :icon="locale.icon"
      :class="{ active: currentLocale === locale.code }"
      :aria-label="getButtonTranslation(currentLocale).ariaLabelLang"
      @click="switchLocale(locale.code)"
     />
  </div>
</template>

<style lang="scss" scoped>
.lang-switcher {
  height: auto;
  display: flex;
  column-gap: toRem(12);   // между кнопками флагов
  padding-inline: toRem(3);
  padding-block: toRem(2);
  border-radius: toRem(4);
}
.active {
   outline: 1px solid var(--active-color);
   outline-offset: 1px;
   cursor: default;

   @include hover {
      scale: 1;
   }
}
</style>