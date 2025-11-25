<script setup>
import { buttonTranslations } from '~/locales/button'

const { currentLocale, locales, switchLocale } = useLocale()
</script>

<template>
  <div class="lang-switcher">
    <UButton
      v-for="locale in locales"
      @click="switchLocale(locale.code)"
      :key="locale.code"
      :icon="locale.icon"
      :class="{ active: currentLocale === locale.code }"
      :aria-label="buttonTranslations[currentLocale].ariaLabelLang"
      variant="lang-switcher"
     />
  </div>
</template>

<style lang="scss" scoped>
.lang-switcher {
  height: auto;
  display: flex;
  gap: toRem(12);
  padding-inline: toEm(4);
  padding-block: toRem(3);
  border-radius: toEm(4);
  background-color: var(--secondary-color);

  @media (max-width:$mobile){
   margin-inline-start: toRem(12);
   gap: toRem(16);
  }
  @media (max-width:$mobileSmall){
   margin-inline-start: toEm(0);
  }
}
.active {
   border: 1px solid var(--danger-color);
   border-radius: 50%;
   padding: toRem(1);
   font-size: toRem(20);
   cursor: default;

   @include hover {
      scale: 1;
   }
}
</style>