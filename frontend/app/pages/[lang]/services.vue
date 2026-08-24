<script lang="ts" setup>
import { seoTranslations } from '~/locales/seo'

const { find } = useStrapi()
const { currentLocale } = useLocale()
const route = useRoute()
const config = useRuntimeConfig()
const t = computed(() => seoTranslations[currentLocale.value])

const { data: page } = useAsyncData(
  `services-page-${currentLocale.value}`,
  async () => {
    const response = await find("services-page")
    return response.data?.[0] || response.data
  }
)

const seo = computed(() => page.value?.seo)
const seoTitle = computed(() => seo.value?.metaTitle || page.value?.title || t.value.servicesFallback)

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
  <section class="services-page" aria-labelledby="services-page-title">
    <div class="services-page__container">
      <h1 id="services-page-title">{{ page?.title }}</h1>
      <MDC v-if="page?.content" :value="page.content" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.services-page {
  padding-block-start: toEm(32);

  h1 {
    font-size: toEm(32);
    margin-block-end: toRem(24);
  }
}
</style>
