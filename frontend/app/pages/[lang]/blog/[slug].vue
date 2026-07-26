<script lang="ts" setup>
const route = useRoute()
const { find } = useStrapi()
const { currentLocale } = useLocale()

const { data: post } = useAsyncData(
  `blog-${route.params.slug}-${currentLocale.value}`,
  async () => {
    const response = await find("blogs", {
      filters: { slug: { $eq: route.params.slug } },
    })
    return response.data?.[0] || null
  }
)

const seo = computed(() => post.value?.seo)
useSeoMeta({
  title: seo.value?.metaTitle || post.value?.title || "Блог",
  ogTitle: seo.value?.metaTitle || post.value?.title || "Блог",
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
  <article v-if="post" class="blog-post">
    <NuxtLink :to="`/${currentLocale}/blog`" class="blog-post__back">← Назад к блогу</NuxtLink>
    <header class="blog-post__header">
      <h1>{{ post.title }}</h1>
      <time class="blog-post__date">{{ post.date }}</time>
      <span v-if="post.author" class="blog-post__author">{{ post.author }}</span>
    </header>
    <MDC v-if="post.content" :value="post.content" class="blog-post__content" />
  </article>
  <div v-else class="blog-post__empty">Статья не найдена</div>
</template>

<style lang="scss" scoped>
.blog-post {
  padding-block-start: toEm(32);
  max-width: toRem(800);
  margin-inline: auto;

  &__back {
    display: inline-block;
    margin-block-end: toRem(16);
    color: var(--success-color);
    text-decoration: none;
  }

  &__header {
    margin-block-end: toRem(24);

    h1 {
      font-size: toEm(32);
      margin-block-end: toRem(8);
    }
  }

  &__date, &__author {
    font-size: toEm(14);
    color: var(--gray-color);
    margin-inline-end: toRem(16);
  }

  &__empty {
    text-align: center;
    padding: toRem(48);
    color: var(--gray-color);
  }
}
</style>
