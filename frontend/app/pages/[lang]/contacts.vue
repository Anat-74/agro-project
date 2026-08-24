<script lang="ts" setup>
import { seoTranslations } from '~/locales/seo'

const { find } = useStrapi()
const { currentLocale } = useLocale()
const route = useRoute()
const config = useRuntimeConfig()
const t = computed(() => seoTranslations[currentLocale.value])

const { data: page } = useAsyncData(
  `contacts-page-${currentLocale.value}`,
  async () => {
    const response = await find("contacts-page")
    return response.data?.[0] || response.data
  }
)

const seo = computed(() => page.value?.seo)
const seoTitle = computed(() => seo.value?.metaTitle || page.value?.title || t.value.contactsFallback)

useSeoMeta({
  title: seoTitle,
  ogTitle: seoTitle,
  description: seo.value?.metaDescription || seoTitle.value,
  ogDescription: seo.value?.metaDescription || seoTitle.value,
  ogUrl: `${config.public.siteUrl}${route.fullPath}`,
  ogImage: `${config.public.siteUrl}/pwa-512x512.png`,
})

useHead({
  script: seo.value?.structuredData
    ? [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(seo.value.structuredData),
        },
      ]
    : [],
})
</script>

<template>
  <section class="contacts-page" aria-labelledby="contacts-page-title">
    <div class="contacts-page__container">
      <h1 id="contacts-page-title">{{ page?.title }}</h1>
      <MDC v-if="page?.content" :value="page.content" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.contacts-page {
  padding-block-start: toEm(32);

  h1 {
    font-size: toEm(32);
    margin-block-end: toRem(24);
  }
}
</style>
