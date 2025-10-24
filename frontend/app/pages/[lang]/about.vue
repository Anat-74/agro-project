<script lang="ts" setup>
import type { LocaleCode } from "../../types/types"
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
const { currentLocale } = useLocale()

const pageMeta = {
  ru: {
    title: 'О нас',
    description: 'Страница - о нас'
  },
  en: {
    title: 'About Us',
    description: 'Page - about us'
  },
  be: {
    title: 'Пра нас',
    description: 'Старонка - пра нас'
  }
}

useSeoMeta({
  title: pageMeta[currentLocale.value as LocaleCode].title,
  ogTitle: pageMeta[currentLocale.value as LocaleCode].title,
  description: pageMeta[currentLocale.value as LocaleCode].description,
  ogDescription: pageMeta[currentLocale.value as LocaleCode].description
})

// definePageMeta({
//    layout: 'back-to-main'
//    })
</script>

<template>
      <section 
      class="about-us"
      aria-labelledby="about-us">
         <h1
         class="visually-hidden"
         id="about-us"
         >{{ visuallyHiddenTranslations[currentLocale].sectionAboutUsTitle }}</h1>
         <p>В процессе наполнения контентом...</p>
         <p>In the process of filling with content...</p>
      </section>
</template>

<style lang="scss" scoped>
.about-us {
   height: 50dvh;
   padding-block-start: toEm(32);

   p {
      font-size: toEm(22);
      margin-block-end: toRem(16);
   }
}

</style>