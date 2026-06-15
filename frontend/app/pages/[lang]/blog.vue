<script lang="ts" setup>
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
const { currentLocale } = useLocale()
const t = computed(() => visuallyHiddenTranslations[currentLocale.value]);

const pageMeta = {
  ru: {
    title: "Блог",
    description: "Страница блога",
  },
  be: {
    title: "Блог",
    description: "Старонка - блога",
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

<template>
  <section class="about-us" aria-labelledby="about-us">
    <h1 class="visually-hidden" id="about-us">
      {{ t.sectionBlogTitle }}
    </h1>
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
