<script lang="ts" setup>
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
const { currentLocale } = useLocale()
const t = computed(() => visuallyHiddenTranslations[currentLocale.value]);

const pageMeta = {
  ru: {
    title: "Наши услуги",
    description: "Страница с нашими услугами",
  },
  be: {
    title: "Нашы паслугі",
    description: "Старонка з нашымі паслугамі",
  },
};

useSeoMeta({
  title: pageMeta[currentLocale.value as LocaleCode].title,
  ogTitle: pageMeta[currentLocale.value as LocaleCode].title,
  description: pageMeta[currentLocale.value as LocaleCode].description,
  ogDescription: pageMeta[currentLocale.value as LocaleCode].description,
});

// definePageMeta({
//    layout: 'back-to-main'
//    })
</script>

<style lang="scss" scoped></style>
<template>
  <section class="services" aria-labelledby="our-services">
    <h1 class="visually-hidden" id="our-services">
      {{ t.sectionOurServicesTitle }}
    </h1>
    <p>В процессе наполнения контентом...</p>
    <p>In the process of filling with content...</p>
  </section>
</template>

<style lang="scss" scoped>
.services {
  height: 50dvh;
  padding-block-start: toEm(32);

  p {
    font-size: toEm(22);
    margin-block-end: toRem(16);
  }
}
</style>
