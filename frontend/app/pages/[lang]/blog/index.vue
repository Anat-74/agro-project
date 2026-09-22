<script lang="ts" setup>
import { seoTranslations } from '~/locales/seo'
import ShowModalArticle from "~/components/show-modal/ShowModalArticle.vue"

const { find } = useStrapi()
const { currentLocale } = useLocale()
const route = useRoute()
const config = useRuntimeConfig()
const t = computed(() => seoTranslations[currentLocale.value])

// Клик по статье: на телефоне/планшете открываем модальное окно вместо перехода
// на страницу (страница остаётся для десктопа и поиска)
const articleModalRef = useTemplateRef<InstanceType<typeof ShowModalArticle>>("article-modal")
const { activeArticle, interceptArticleClick } = useArticleModal()

const onArticleClick = (item: ArticleLinkItem, event: MouseEvent) => {
  if (!interceptArticleClick(item, event)) return
  nextTick(() => articleModalRef.value?.openModal())
}

interface BlogListItem {
  id?: number
  documentId?: string
  slug?: string
  title?: string
  date?: string | null
  author?: string | null
  image?: { url?: string } | null
}

const { data: posts } = useAsyncData(
  `blog-list-${currentLocale.value}`,
  async () => {
    const response = await find<BlogListItem>("blogs", {
      sort: "date:desc",
      pagination: { pageSize: 50 },
    } as any)
    return (response.data || []) as BlogListItem[]
  }
)

// SEO (страница-список: статическая локализованная мета + ogUrl/ogImage)
useSeoMeta({
  title: t.value.blogTitle,
  ogTitle: t.value.blogTitle,
  description: t.value.blogDescription,
  ogDescription: t.value.blogDescription,
  ogUrl: `${config.public.siteUrl}${route.fullPath}`,
  ogImage: `${config.public.siteUrl}/pwa-512x512.png`,
})
</script>

<template>
  <section class="blog-page" aria-labelledby="blog-page-title">
    <div class="blog-page__container">
      <h1 id="blog-page-title" class="blog-page__title">Блог</h1>

      <div v-if="!posts?.length" class="blog-page__empty">
        Скоро здесь появятся статьи
      </div>

      <ul v-else class="blog-page__list">
        <li
          v-for="post in posts || []"
          :key="post.documentId || post.id"
          class="blog-page__item"
          @click.capture="onArticleClick(post, $event)"
        >
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
              >
              <div class="blog-card__body">
                <time class="blog-card__date">{{ post.date }}</time>
                <h2 class="blog-card__title">{{ post.title }}</h2>
                <span v-if="post.author" class="blog-card__author">{{ post.author }}</span>
              </div>
            </article>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- Модальное окно статьи: на телефоне читаем здесь, страница — для десктопа и поиска -->
    <ShowModalArticle
      ref="article-modal"
      :slug="activeArticle?.slug"
      :title="activeArticle?.title"
      :date="activeArticle?.date"
    />
  </section>
</template>

<style lang="scss" scoped>
.blog-page {
  padding-block-start: toEm(32);

  // Размер заголовка — глобальный (стиль-гайд §16), здесь только отступ.
  // toRem, а не toEm: у заголовка свой крупный шрифт, и em считался бы от него
  &__title {
    margin-block-end: toRem(24);
  }

  &__empty {
    text-align: center;
    padding: toEm(48);
    color: var(--gray-color);
    font-size: toEm(18);
  }

  &__list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: toEm(16);
  }

  &__link {
    text-decoration: none;
    color: inherit;
  }
}

.blog-card {
  display: flex;
  gap: toEm(16);
  padding: toEm(16);
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
    gap: toEm(8);
  }

  &__date {
    font-size: toEm(14);
    color: var(--gray-color);
  }

  &__title {
    margin: 0;
    color: var(--color);
  }

  &__author {
    font-size: toEm(14);
    color: var(--gray-color);
  }
}
</style>
