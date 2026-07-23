<script lang="ts" setup>
const route = useRoute()
const { find } = useStrapi()
const { currentLocale } = useLocale()

const { data: item } = useAsyncData(
  `news-${route.params.slug}-${currentLocale.value}`,
  async () => {
    const response = await find("news-articles", {
      filters: { slug: { $eq: route.params.slug } },
    })
    return response.data?.[0] || null
  }
)

const seo = computed(() => item.value?.seo)
useSeoMeta({
  title: seo.value?.metaTitle || item.value?.title || "Новости",
  ogTitle: seo.value?.metaTitle || item.value?.title || "Новости",
  description: seo.value?.metaDescription || "",
  ogDescription: seo.value?.metaDescription || "",
})
</script>

<template>
  <article v-if="item" class="news-article">
    <NuxtLink :to="`/${currentLocale}/news`" class="news-article__back">← Назад к новостям</NuxtLink>
    <header class="news-article__header">
      <h1>{{ item.title }}</h1>
      <time class="news-article__date">{{ item.date }}</time>
    </header>
    <MDC v-if="item.content" :value="item.content" class="news-article__content" />
  </article>
  <div v-else class="news-article__empty">Новость не найдена</div>
</template>

<style lang="scss" scoped>
.news-article {
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

  &__date {
    font-size: toEm(14);
    color: var(--gray-color);
  }

  &__empty {
    text-align: center;
    padding: toRem(48);
    color: var(--gray-color);
  }
}
</style>
