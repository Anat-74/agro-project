<script lang="ts" setup>
import { gardenTranslations } from "~/locales/garden";

const route = useRoute()
const { find } = useStrapi()
const { currentLocale } = useLocale()
const t = computed(() => gardenTranslations[currentLocale.value])

// Мобильный/планшетный сценарий: не уводим на страницу калькулятора, а открываем
// панель каталога на вкладке «Посадка» (паттерн корзины: ≤ tablet — диалог).
// Кнопка, а не NuxtLink: у ссылки навигация срабатывает раньше preventDefault.
const { width } = useViewport()
const { requestOpen } = useGardenDialog()
const onCalculatorClick = () => {
  if (width.value && width.value <= 1024) {
    requestOpen()
    return
  }
  navigateTo(`/${currentLocale.value}/posadka-i-urozhay`)
}

interface BlogCrop {
  name: string
  slug?: string
}
interface BlogPost {
  title?: string
  slug?: string
  content?: string
  date?: string
  author?: string
  seo?: { metaTitle?: string; metaDescription?: string; structuredData?: unknown }
  crops?: BlogCrop[]
}

const { data: post } = useAsyncData(`blog-${route.params.slug}-${currentLocale.value}`, async () => {
  const response = await find<BlogPost>("blogs", {
    filters: {
      slug: { $eq: route.params.slug },
      locale: { $eq: currentLocale.value },
    },
    // Связь blog ↔ crop: на странице статьи показываем «Рассчитать посадку»
    populate: { crops: true },
  } as any)
  return (response.data?.[0] || null) as BlogPost | null
})

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
  <div>
    <article v-if="post" class="blog-post">
      <NuxtLink :to="`/${currentLocale}/blog`" class="blog-post__back">← Назад к блогу</NuxtLink>
      <header class="blog-post__header">
        <h1>{{ post.title }}</h1>
        <time class="blog-post__date">{{ post.date }}</time>
        <span v-if="post.author" class="blog-post__author">{{ post.author }}</span>
      </header>
      <MDC v-if="post.content" :value="post.content" class="blog-post__content" />

      <!-- Перелинковка статьи с разделом посадок (blog ↔ crop) -->
      <aside class="blog-post__calc">
        <UButton
          variant="plain"
          class="blog-post__calc-link"
          @click="onCalculatorClick"
        >
          <Icon name="cil:calculator" />
          {{ t.calculatorCta }}
        </UButton>
        <p v-if="post.crops?.length" class="blog-post__crops">
          <span class="blog-post__crops-label">{{ t.relatedCrop }}:</span>
          {{ post.crops.map((crop: { name: string }) => crop.name).join(", ") }}
        </p>
      </aside>
    </article>
    <div v-else class="blog-post__empty">Статья не найдена</div>
  </div>
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

  // Блок «Рассчитать посадку» + растения статьи
  &__calc {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    row-gap: toEm(8);
    margin-block-start: toRem(32);
    padding: toEm(16);
    border: toRem(1) solid var(--green-color);
    border-radius: toRem(12);
  }

  &__calc-link {
    display: inline-flex;
    align-items: center;
    column-gap: toEm(6);
    padding: toEm(8) toEm(14);
    border-radius: toRem(8);
    background-color: var(--green-color);
    color: var(--light-color);
    font-weight: 600;
    text-decoration: none;
    transition: opacity var(--transition-duration);

    @include hover {
      opacity: 0.9;
    }
  }

  &__crops {
    color: var(--gray-color);
  }

  &__crops-label {
    font-weight: 600;
    color: var(--primary-color);
  }
}
</style>
