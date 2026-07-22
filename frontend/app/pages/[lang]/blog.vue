<script lang="ts" setup>
const { find } = useStrapi()
const { currentLocale } = useLocale()

const { data: posts } = useAsyncData(
  `blog-list-${currentLocale.value}`,
  async () => {
    const response = await find("blogs", {
      sort: "date:desc",
      pagination: { pageSize: 50 },
    })
    return response.data || []
  }
)

useSeoMeta({
  title: "Блог | АгроМаркет",
  ogTitle: "Блог | АгроМаркет",
  description: "Статьи и советы о свежих органических продуктах",
  ogDescription: "Статьи и советы о свежих органических продуктах",
})
</script>

<template>
  <section class="blog-page" aria-labelledby="blog-page-title">
    <h1 id="blog-page-title">Блог</h1>

    <div v-if="!posts.length" class="blog-page__empty">
      Скоро здесь появятся статьи
    </div>

    <ul v-else class="blog-page__list">
      <li v-for="post in posts" :key="post.documentId || post.id" class="blog-page__item">
        <NuxtLink
          :to="`/${currentLocale}/blog/${post.slug}`"
          class="blog-page__link"
        >
          <article class="blog-card">
            <img
              v-if="post.image?.url"
              :src="post.image.url"
              :alt="post.title"
              class="blog-card__image"
            />
            <div class="blog-card__body">
              <time class="blog-card__date">{{ post.date }}</time>
              <h2 class="blog-card__title">{{ post.title }}</h2>
              <span class="blog-card__author" v-if="post.author">{{ post.author }}</span>
            </div>
          </article>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.blog-page {
  padding-block-start: toEm(32);
  max-width: toRem(800);
  margin-inline: auto;

  h1 {
    font-size: toEm(32);
    margin-block-end: toRem(24);
  }

  &__empty {
    text-align: center;
    padding: toRem(48);
    color: var(--gray-color);
    font-size: toEm(18);
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

.blog-card {
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

  &__author {
    font-size: toEm(14);
    color: var(--gray-color);
  }
}
</style>
