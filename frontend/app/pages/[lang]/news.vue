<script lang="ts" setup>
import { seoTranslations } from '~/locales/seo'

const { find } = useStrapi()
const { currentLocale } = useLocale()
const route = useRoute()
const config = useRuntimeConfig()
const t = computed(() => seoTranslations[currentLocale.value])

const { data: items } = useAsyncData(
  `news-list-${currentLocale.value}`,
  async () => {
    const response = await find("news-articles", {
      sort: "date:desc",
      pagination: { pageSize: 50 },
    })
    return response.data || []
  }
)

// SEO (страница-список: статическая локализованная мета + ogUrl/ogImage)
useSeoMeta({
  title: t.value.newsTitle,
  ogTitle: t.value.newsTitle,
  description: t.value.newsDescription,
  ogDescription: t.value.newsDescription,
  ogUrl: `${config.public.siteUrl}${route.fullPath}`,
  ogImage: `${config.public.siteUrl}/pwa-512x512.png`,
})
</script>

<template>
  <section class="news-page" aria-labelledby="news-page-title">
    <div class="news-page__container">
      <h1 id="news-page-title">Новости</h1>

      <div v-if="!items?.length" class="news-page__empty">
        Скоро здесь появятся новости
      </div>

      <ul v-else class="news-page__list">
        <li v-for="item in items || []" :key="item.documentId || item.id" class="news-page__item">
          <NuxtLink
            :to="`/${currentLocale}/news/${item.slug}`"
            class="news-page__link"
          >
            <article class="news-card">
              <img
                v-if="item.image?.url"
                :src="item.image.url"
                :alt="item.title"
                class="news-card__image"
              >
              <div class="news-card__body">
                <time class="news-card__date">{{ item.date }}</time>
                <h2 class="news-card__title">{{ item.title }}</h2>
              </div>
            </article>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.news-page {
  padding-block-start: toEm(32);

  h1 {
    font-size: toEm(32);
    margin-block-end: toRem(24);
  }

  &__empty {
    text-align: center;
    padding: toRem(48);
    color: var(--gray-color);
  }

  &__list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: toRem(16);
  }

  &__link {
    text-decoration: none;
    color: inherit;
  }
}

.news-card {
  display: flex;
  gap: toRem(16);
  padding: toRem(16);
  border: toRem(1) solid var(--border-color);
  border-radius: toRem(8);

  &__image {
    width: toRem(180);
    height: toRem(120);
    object-fit: cover;
    border-radius: toRem(4);
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: toRem(8);
  }

  &__date {
    font-size: toEm(14);
    color: var(--gray-color);
  }

  &__title {
    margin: 0;
    font-size: toEm(20);
    color: var(--color);
  }
}
</style>
