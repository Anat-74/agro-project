<script setup lang="ts">
import { breadcrumbsTranslations } from "~/locales/breadcrumbs";
import type { GardenTranslations } from "~/locales/garden";
import type { CalcSectionConfig, CalcTextKey } from "~/utils/calcSections";
// Движок секции-калькулятора: без явного импорта тег рендерился бы как
// неизвестный элемент (авто-имя для этого пути — ShowModalCalcSection)
import CalcSection from "~/components/show-modal/CalcSection.vue";
import ShowModalArticle from "~/components/show-modal/ShowModalArticle.vue";

// Хаб-страница раздела-калькулятора (SEO + калькулятор). Всё раздел-специфичное
// приходит пропсами: single type страницы, конфигурация секции, тексты, коллекция
// предметов, связь статей и режимы для скрытого SEO-блока. Используется и
// «Посадкой», и «Заготовками» — без дублирования разметки и стилей.
interface Props {
  /** Single type страницы раздела (calculator-page / preserve-page) */
  pageEndpoint: string;
  /** Конфигурация секции-калькулятора */
  section: CalcSectionConfig<any, any, any>;
  /** Тексты раздела */
  texts: GardenTranslations;
  /** Коллекция предметов раздела (crops / preserves) */
  itemsEndpoint: string;
  /** Поле связи статей блога с предметом (crops / preserves) */
  articlesRelation: string;
  /** Ключи подписей режимов — для скрытого SEO-блока */
  modeKeys: CalcTextKey[];
  /** Запрос открытия панели на слайде раздела (≤ $tablet) */
  requestPanel: () => void;
  /** Базовый путь страниц предметов (напр. `/posadka-i-urozhay`) — если задан,
   *  предметы в скрытом блоке рендерятся ссылками */
  itemsLinkBase?: string;
}

const props = withDefaults(defineProps<Props>(), {
  itemsLinkBase: "",
});
const t = computed(() => props.texts);

const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();
const config = useRuntimeConfig();

// Клик по статье: на телефоне — модальное окно, на десктопе — переход на страницу
const articleModalRef = useTemplateRef<InstanceType<typeof ShowModalArticle>>("article-modal");
const { activeArticle, interceptArticleClick } = useArticleModal();

const onArticleClick = (item: ArticleLinkItem, event: MouseEvent) => {
  if (!interceptArticleClick(item, event)) return;
  nextTick(() => articleModalRef.value?.openModal());
};

interface PageFaqItem {
  question: string;
  answer: string;
}

interface PageHowToStep {
  name: string;
  text: string;
}

const pageKey = computed(() => `${props.pageEndpoint}-${currentLocale.value}`);
const { data: page } = useAsyncData(pageKey, async () => {
  const response: any = await find(props.pageEndpoint, {
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
const faq = computed<PageFaqItem[]>(() => page.value?.faq || []);

// Статьи раздела: статьи блога, у которых есть связь с предметом раздела —
// страница получает полезный контент и внутренние ссылки
interface SectionArticle {
  documentId: string;
  title: string;
  slug: string;
  date?: string;
}

const articlesKey = computed(() => `${props.pageEndpoint}-articles-${currentLocale.value}`);
const { data: articles } = useAsyncData(articlesKey, async () => {
  const response: any = await find("blogs", {
    filters: {
      locale: { $eq: currentLocale.value },
      [props.articlesRelation]: { documentId: { $notNull: true } },
    },
    sort: ["date:desc"],
    pagination: { pageSize: 6 },
    fields: ["title", "slug", "date"],
  } as any);
  return (response?.data || []) as SectionArticle[];
});

// Скрытый SEO-блок: предметы и товары раздела + режимы расчёта. Названия предметов
// и режимы — текстом, товары — настоящими ссылками; блок видят только поиск и
// скринридеры
type SeoSectionItem = { documentId: string; name: string; slug?: string };
type SeoSectionProduct = Product & {
  category?: { slug?: string } | null;
  subcategory?: { slug?: string } | null;
};

const { getProductLink } = useProductLink();
const seoSectionKey = computed(() => `${props.pageEndpoint}-seo-section-${currentLocale.value}`);
const { data: seoSection } = useAsyncData(seoSectionKey, async () => {
  const [itemsResponse, productsResponse] = await Promise.all([
    find<SeoSectionItem>(props.itemsEndpoint, {
      filters: {
        locale: { $eq: currentLocale.value },
        isActive: { $eq: true },
      },
      fields: ["name", "slug"],
      sort: ["name:asc"],
      pagination: { pageSize: 100 },
    } as any),
    find<SeoSectionProduct>("products", {
      filters: {
        locale: { $eq: currentLocale.value },
        purpose: { $notNull: true },
      },
      fields: ["name", "slug"],
      populate: {
        category: { fields: ["slug"] },
        subcategory: { fields: ["slug"] },
      },
      pagination: { pageSize: 100 },
    } as any),
  ]);

  return {
    items: (itemsResponse?.data || []) as SeoSectionItem[],
    products: (productsResponse?.data || []) as SeoSectionProduct[],
  };
});

// Шаги HowTo: из Strapi, иначе — локализованный фолбэк из locales/garden.ts
const howToSteps = computed<PageHowToStep[]>(() => {
  const fromStrapi = (page.value?.howTo || []).filter(
    (step: PageHowToStep) => step?.name && step?.text,
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
const pageUrl = computed(() => `${config.public.siteUrl}${route.fullPath}`);
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
  <section class="calc-page" aria-labelledby="calc-page-title">
    <div class="calc-page__container">
      <h1 id="calc-page-title" class="calc-page__title">
        {{ page?.heroTitle || t.title }}
      </h1>
      <p class="calc-page__subtitle">
        {{ page?.heroSubtitle || t.subtitle }}
      </p>

      <div v-if="page?.intro" class="calc-page__intro">
        <MDC :value="page.intro" />
      </div>

      <!-- Калькулятор в потоке страницы: только выше планшета (> $tablet).
           На телефоне/планшете тот же калькулятор живёт в панели каталога —
           единый сценарий без дублирования (кнопка ниже).
           Вопросы в компоненте выключены: они выводятся отдельным блоком ниже,
           чтобы были видны и на телефоне, и поисковым системам -->
      <CalcSection
        class="calc-page__section hidden-tablet"
        :section="section"
        :show-faq="false"
      />

      <!-- ≤ $tablet: открываем панель сразу на вкладке раздела -->
      <UButton
        variant="plain"
        class="calc-page__open visible-tablet"
        @click="requestPanel"
      >
        <Icon name="cil:calculator" />
        {{ t.calculatorCta }}
      </UButton>

      <!-- Статьи раздела -->
      <section v-if="articles?.length" class="calc-page__articles">
        <h2 class="calc-page__articles-title">{{ t.sectionArticles }}</h2>
        <ul class="calc-page__articles-list">
          <li
            v-for="article in articles"
            :key="article.documentId"
            @click.capture="onArticleClick(article, $event)"
          >
            <NuxtLink
              class="calc-page__article"
              :to="`/${currentLocale}/blog/${article.slug}`"
            >
              <Icon name="mingcute:document-line" />
              <span class="calc-page__article-name">{{ article.title }}</span>
              <time
                v-if="article.date"
                class="calc-page__article-date"
                :datetime="article.date"
              >{{ article.date }}</time>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Частые вопросы: виден на всех экранах, разметку FAQPage отдаём в JSON-LD -->
      <section v-if="faq.length" class="calc-page__faq">
        <h2 class="calc-page__faq-title">{{ t.faqTitle }}</h2>
        <UAccordion
          v-for="(item, index) in faq"
          :key="index"
          :name="`calc-faq-page-${index}`"
        >
          <template #header>
            <h3 class="calc-page__faq-question">{{ item.question }}</h3>
          </template>
          <div class="calc-page__faq-answer">
            <div class="calc-page__faq-text">
              <MDC :value="item.answer" />
            </div>
          </div>
        </UAccordion>
      </section>

      <!-- Скрытый SEO-блок: раздел, предметы, товары и режимы расчёта.
           Виден только поисковым системам и скринридерам -->
      <section class="visually-hidden">
        <h2>{{ t.title }}</h2>
        <p>{{ t.subtitle }}</p>

        <h3>{{ t.seoPlantsTitle }}</h3>
        <ul>
          <li v-for="item in seoSection?.items" :key="item.documentId">
            <!-- Если у предметов раздела есть свои страницы (например, растения
                 «Посадки»), отдаём настоящие ссылки — для индексации -->
            <NuxtLink
              v-if="props.itemsLinkBase && item.slug"
              :to="`/${currentLocale}${props.itemsLinkBase}/${item.slug}`"
            >
              {{ item.name }}
            </NuxtLink>
            <template v-else>{{ item.name }}</template>
          </li>
        </ul>

        <h3>{{ t.seoProductsTitle }}</h3>
        <ul>
          <li v-for="product in seoSection?.products" :key="product.documentId">
            <NuxtLink :to="getProductLink(product)">{{ product.name }}</NuxtLink>
          </li>
        </ul>

        <h3>{{ t.seoModesTitle }}</h3>
        <ul>
          <li v-for="key in props.modeKeys" :key="key">{{ t[key] }}</li>
        </ul>
      </section>
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
.calc-page {
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

  &__section {
    min-height: auto;
  }

  // Кнопка «Рассчитать» на телефоне/планшете (калькулятор — в панели)
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

  // Статьи раздела
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
    // Родитель — аккордеон проекта со шрифтом 22px, поэтому делитель указываем
    // явно: без него toEm(16) дал бы 22px (em считается от родителя)
    font-size: toEm(16, 22);
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
