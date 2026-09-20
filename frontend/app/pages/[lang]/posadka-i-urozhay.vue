<script setup lang="ts">
import { gardenTranslations } from "~/locales/garden";
import { breadcrumbsTranslations } from "~/locales/breadcrumbs";
// Явный импорт: авто-имя для этого пути — ShowModalHamburgerGarden,
// поэтому без импорта тег рендерился как неизвестный (пустой) элемент
import HamburgerGarden from "~/components/show-modal/HamburgerGarden.vue";

// Хаб-страница раздела «Всё для посадки и урожая» (SEO + калькулятор).
// Контент — single type `calculator-page` из Strapi (i18n).
const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();
const config = useRuntimeConfig();
const t = computed(() => gardenTranslations[currentLocale.value]);

// ≤ $tablet: калькулятор открывается в панели каталога (вкладка «Посадка»),
// а не дублируется на странице — запрос обрабатывает AppHeader
const { requestOpen } = useGardenDialog();
const requestOpenGarden = () => requestOpen();

interface CalculatorFaqItem {
  question: string;
  answer: string;
}

interface CalculatorHowToStep {
  name: string;
  text: string;
}

const pageKey = computed(() => `calculator-page-${currentLocale.value}`);
const { data: page } = useAsyncData(pageKey, async () => {
  const response: any = await find("calculator-page", {
    filters: { locale: { $eq: currentLocale.value } },
    // Компоненты (faq/seo/howTo) в Strapi v5 приходят только с populate
    populate: { faq: true, seo: true, howTo: true },
  } as any);
  return response?.data?.[0] || response?.data || null;
});

const seo = computed(() => page.value?.seo);
const seoTitle = computed(
  () => seo.value?.metaTitle || page.value?.heroTitle || t.value.title,
);
const seoDescription = computed(
  () => seo.value?.metaDescription || page.value?.heroSubtitle || t.value.subtitle,
);
const faq = computed<CalculatorFaqItem[]>(() => page.value?.faq || []);

// Статьи по растениям раздела: страница не должна быть пустой для человека
// (особенно на телефоне) и получает полезный контент и внутренние ссылки.
// Отбираем статьи блога, у которых есть связь с растением (blog ↔ crop)
interface SectionArticle {
  documentId: string;
  title: string;
  slug: string;
  date?: string;
}

const articlesKey = computed(() => `garden-section-articles-${currentLocale.value}`);
const { data: articles } = useAsyncData(articlesKey, async () => {
  const response: any = await find("blogs", {
    filters: {
      locale: { $eq: currentLocale.value },
      crops: { documentId: { $notNull: true } },
    },
    sort: ["date:desc"],
    pagination: { pageSize: 6 },
    fields: ["title", "slug", "date"],
  } as any);
  return (response?.data || []) as SectionArticle[];
});
// Шаги HowTo: из Strapi, иначе — локализованный фолбэк из locales/garden.ts
const howToSteps = computed<CalculatorHowToStep[]>(() => {
  const fromStrapi = (page.value?.howTo || []).filter(
    (step: CalculatorHowToStep) => step?.name && step?.text,
  );
  return fromStrapi.length ? fromStrapi : t.value.howToSteps;
});

useSeoMeta({
  title: seoTitle,
  ogTitle: seoTitle,
  description: seoDescription,
  ogDescription: seoDescription,
  ogUrl: `${config.public.siteUrl}${route.fullPath}`,
  ogImage: `${config.public.siteUrl}/pwa-512x512.png`,
});

// JSON-LD через @nuxtjs/seo (useSchemaOrg): модуль сам собирает единый @graph,
// связывает вопросы с FAQPage и сериализует разметку — ручной useHead не нужен.
const pageUrl = computed(
  () => `${config.public.siteUrl}${route.fullPath}`,
);
const stripHtml = (html: string) => String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Передаём computed (ref) целиком: unhead разворачивает реактивные значения при
// резолве тегов, поэтому асинхронные faq/seo попадают и в SSR-разметку.
const schemaOrgNodes = computed<any[]>(() => {
  const nodes: any[] = [
    defineWebPage({
      "@type": "FAQPage",
      name: seoTitle.value,
      description: seoDescription.value,
      url: pageUrl.value,
      inLanguage: currentLocale.value,
    }),
    defineBreadcrumb({
      itemListElement: [
        {
          name: breadcrumbsTranslations[currentLocale.value].home,
          item: `${config.public.siteUrl}/${currentLocale.value}`,
        },
        { name: seoTitle.value, item: pageUrl.value },
      ],
    }),
    ...faq.value.map((f) =>
      defineQuestion({
        question: f.question,
        acceptedAnswer: { text: stripHtml(f.answer) },
      }),
    ),
    defineHowTo({
      name: t.value.howToTitle,
      step: howToSteps.value.map((step) =>
        defineHowToStep({ name: step.name, text: stripHtml(step.text) }),
      ),
    }),
  ];

  // Разметка из Strapi (seo.structuredData) — как дополнительный узел графа
  if (seo.value?.structuredData) nodes.push(seo.value.structuredData);

  return nodes;
});

useSchemaOrg(schemaOrgNodes);
</script>

<template>
  <section class="garden-page" aria-labelledby="garden-page-title">
    <div class="garden-page__container">
      <h1 id="garden-page-title" class="garden-page__title">
        {{ page?.heroTitle || t.title }}
      </h1>
      <p class="garden-page__subtitle">
        {{ page?.heroSubtitle || t.subtitle }}
      </p>

      <div v-if="page?.intro" class="garden-page__intro">
        <MDC :value="page.intro" />
      </div>

      <!-- Калькулятор в потоке страницы: только выше планшета (> $tablet).
           На телефоне/планшете тот же калькулятор живёт в панели каталога —
           единый сценарий без дублирования (кнопка ниже).
           Вопросы в компоненте выключены: они выводятся отдельным блоком ниже,
           чтобы были видны и на телефоне, и поисковым системам -->
      <HamburgerGarden class="garden-page__garden hidden-tablet" :show-faq="false" />

      <!-- ≤ $tablet: открываем панель сразу на вкладке «Посадка» -->
      <UButton
        variant="plain"
        class="garden-page__open visible-tablet"
        @click="requestOpenGarden"
      >
        <Icon name="cil:calculator" />
        {{ t.calculatorCta }}
      </UButton>

      <!-- Статьи по растениям раздела -->
      <section v-if="articles?.length" class="garden-page__articles">
        <h2 class="garden-page__articles-title">{{ t.sectionArticles }}</h2>
        <ul class="garden-page__articles-list">
          <li v-for="article in articles" :key="article.documentId">
            <NuxtLink
              class="garden-page__article"
              :to="`/${currentLocale}/blog/${article.slug}`"
            >
              <Icon name="mingcute:document-line" />
              <span class="garden-page__article-name">{{ article.title }}</span>
              <time
                v-if="article.date"
                class="garden-page__article-date"
                :datetime="article.date"
              >{{ article.date }}</time>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Частые вопросы: виден на всех экранах, разметку FAQPage отдаём в JSON-LD -->
      <section v-if="faq.length" class="garden-page__faq">
        <h2 class="garden-page__faq-title">{{ t.faqTitle }}</h2>
        <UAccordion
          v-for="(item, index) in faq"
          :key="index"
          :name="`garden-faq-page-${index}`"
        >
          <template #header>
            <h3 class="garden-page__faq-question">{{ item.question }}</h3>
          </template>
          <div class="garden-page__faq-answer">
            <div class="garden-page__faq-text">
              <MDC :value="item.answer" />
            </div>
          </div>
        </UAccordion>
      </section>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.garden-page {
  padding-block: toEm(32);

  // Заголовки (h1/h2) стилизуются глобально (style guide §16) — не переопределяем
  &__container {
    display: flex;
    flex-direction: column;
    row-gap: toEm(20);
  }

  &__subtitle {
    color: var(--gray-color);
  }

  &__garden {
    min-height: auto;
  }

  // Кнопка «Рассчитать посадку» на телефоне/планшете (калькулятор — в панели)
  &__open {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    column-gap: toEm(8);
    padding: toEm(10) toEm(18);
    border-radius: toRem(8);
    background-color: var(--green-color);
    color: var(--light-color);
    font-weight: 600;
    transition: opacity var(--transition-duration);

    @include hover {
      opacity: 0.9;
    }
  }

  // Статьи по растениям раздела
  &__articles {
    display: flex;
    flex-direction: column;
    row-gap: toEm(10);
  }

  &__articles-list {
    display: grid;
    gap: toEm(8);
    grid-template-columns: repeat(auto-fill, minmax(toRem(260), 1fr));
  }

  &__article {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: toEm(8);
    padding: toEm(10) toEm(12);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(8);
    background-color: var(--light-color);
    color: var(--color);
    text-decoration: none;
    transition:
      border-color var(--transition-duration),
      color var(--transition-duration);

    @include hover {
      border-color: var(--green-color);
      color: var(--green-color);
    }
  }

  &__article-name {
    font-weight: 600;
  }

  &__article-date {
    grid-column: 2;
    color: var(--gray-color);
    font-size: toEm(13);
  }

  // Частые вопросы (аккордеон проекта; ответы видны только у раскрытого вопроса)
  &__faq {
    display: flex;
    flex-direction: column;
    row-gap: toEm(6);
  }

  &__faq-question {
    font-size: toEm(16);
    font-weight: 600;
    text-align: left;
  }

  &__faq-answer {
    // ОБЯЗАТЕЛЬНО: контент аккордеона лежит рядом с <details>, схлопывание
    // работает только с overflow: hidden, иначе ответ виден всегда
    overflow: hidden;
  }

  // Отступы — на самом ответе, а не на обёртке: паддинг обёртки не схлопывается,
  // и у закрытого вопроса оставалась бы видимая полоса
  &__faq-text {
    padding: toEm(8) toEm(4);
  }
}
</style>
