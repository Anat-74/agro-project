<script lang="ts" setup>
const { find } = useStrapi()
const { currentLocale } = useLocale()

const { data: page } = useAsyncData(
  `services-page-${currentLocale.value}`,
  async () => {
    const response = await find("services-page")
    return response.data?.[0] || response.data
  }
)

const seo = computed(() => page.value?.seo)
useSeoMeta({
  title: seo.value?.metaTitle || page.value?.title || "Услуги",
  ogTitle: seo.value?.metaTitle || page.value?.title || "Услуги",
  description: seo.value?.metaDescription || "",
  ogDescription: seo.value?.metaDescription || "",
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
    <h1 id="services-page-title">{{ page?.title }}</h1>
    <MDC v-if="page?.content" :value="page.content" />
  </section>
</template>

<style lang="scss" scoped>
.services-page {
  padding-block-start: toEm(32);
  max-width: toRem(800);
  margin-inline: auto;

  h1 {
    font-size: toEm(32);
    margin-block-end: toRem(24);
  }
}
</style>
