<script lang="ts" setup>
import type { LocaleCode } from "../../types/types"
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
const { currentLocale } = useLocale()

const pageMeta = {
  ru: {
    title: 'Контакты',
    description: 'Страница с контактами'
  },
  en: {
    title: 'Contacts',
    description: 'Contact page'
  },
  be: {
    title: 'Кантакты',
    description: 'Старонка з кантактамі'
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
      class="contacts"
      aria-labelledby="contacts-page">
         <h1
         class="visually-hidden"
         id="contacts-page"
         >{{ visuallyHiddenTranslations[currentLocale].sectionAboutUsTitle }}</h1>
         <p>В процессе наполнения контентом...</p>
         <p>In the process of filling with content...</p>
      </section>
</template>

<style lang="scss" scoped>
.contacts {
   height: 50dvh;
   padding-block-start: toEm(32);

   p {
      font-size: toEm(22);
      margin-block-end: toRem(16);
   }
}

</style>