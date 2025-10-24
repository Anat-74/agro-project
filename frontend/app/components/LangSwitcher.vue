<script setup>
import { buttonTranslations } from '~/locales/button'

const { currentLocale, locales, switchLocale } = useLocale()
</script>

<template>
  <div class="lang-switcher">
    <UButton
      v-for="locale in locales"
      :key="locale.code"
      :icon="locale.icon"
      :class="{ active: currentLocale === locale.code }"
      @click="switchLocale(locale.code)"
      name-class="lang-switcher"
     :aria-label="buttonTranslations[currentLocale].ariaLabelLang"
    />
  </div>
</template>

<style lang="scss" scoped>
.lang-switcher {
  display: inline-flex;
  flex-direction: column;
  gap: toRem(12);
  padding-inline: toEm(12);
  padding-block: toEm(8);
  border-radius: toEm(8);
  margin-inline-start: toRem(38);
  margin-block-start: toEm(8);
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