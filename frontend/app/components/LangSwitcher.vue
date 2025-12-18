<script setup>
import { buttonTranslations } from '~/locales/button'

const { currentLocale, locales, switchLocale } = useLocale()
</script>

<template>
  <div class="lang-switcher">
    <UButton
      v-for="locale in locales"
      @click="switchLocale(locale.code)"
      variant="lang-switcher"
      :key="locale.code"
      :icon="locale.icon"
      :class="{ active: currentLocale === locale.code }"
      :aria-label="buttonTranslations[currentLocale].ariaLabelLang"
     />
  </div>
</template>

<style lang="scss" scoped>
.lang-switcher {
  height: auto;
  display: flex;
  gap: toRem(8);
  padding-inline: toRem(3);
  padding-block: toRem(2);
  border-radius: toRem(4);
  background-color: var(--secondary-color);

  @media (max-width:$mobile){
   flex-direction: column;
   background-color: var(--transparent-color);
  }
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