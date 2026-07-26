<script lang="ts" setup>
const { find } = useStrapi()
const { currentLocale } = useLocale()

const { data: page } = useAsyncData(
  `about-page-${currentLocale.value}`,
  async () => {
    const response = await find("about-page")
    return response.data?.[0] || response.data
  }
)

const seo = computed(() => page.value?.seo)
useSeoMeta({
  title: seo.value?.metaTitle || page.value?.title || "О нас",
  ogTitle: seo.value?.metaTitle || page.value?.title || "О нас",
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
  <section class="about-page" aria-labelledby="about-page-title">
    <h1 id="about-page-title">{{ page?.title }}</h1>
    <MDC v-if="page?.content" :value="page.content" />
  </section>
</template>

<style lang="scss" scoped>
.about-page {
  padding-block-start: toEm(32);
  max-width: toRem(800);
  margin-inline: auto;

  h1 {
    font-size: toEm(32);
    margin-block-end: toRem(24);
  }
}
</style>
