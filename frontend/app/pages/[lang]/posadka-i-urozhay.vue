<script setup lang="ts">
import { gardenTranslations } from "~/locales/garden";
import { breadcrumbsTranslations } from "~/locales/breadcrumbs";

// Хаб-страница раздела «Всё для посадки и урожая» (SEO + калькулятор).
// Контент — single type `calculator-page` из Strapi (i18n).
const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();
const config = useRuntimeConfig();
const t = computed(() => gardenTranslations[currentLocale.value]);

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

      <!-- Интерактивная часть: растения + калькулятор + товары -->
      <HamburgerGarden class="garden-page__garden" />

      <!-- FAQ (для SEO/JSON-LD) -->
      <section v-if="faq.length" class="garden-page__faq">
        <h2 class="garden-page__faq-title">{{ t.faqTitle }}</h2>
        <details v-for="(item, index) in faq" :key="index" class="accordion__details">
          <summary class="accordion__summary">
            <span>{{ item.question }}</span>
            <Icon class="accordion__chevron" name="mingcute:down-line" />
          </summary>
          <div class="accordion__content">
            <div class="garden-page__faq-answer">
              <MDC :value="item.answer" />
            </div>
          </div>
        </details>
      </section>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.garden-page {
  padding-block: toEm(32);

  &__container {
    display: flex;
    flex-direction: column;
    row-gap: toEm(20);
  }

  &__title {
    font-size: toEm(32);
    font-weight: 700;
    color: var(--primary-color);
  }

  &__subtitle {
    color: var(--gray-color);
  }

  &__garden {
    min-height: auto;
  }

  &__faq {
    display: flex;
    flex-direction: column;
    row-gap: toEm(8);
  }

  &__faq-title {
    font-size: toEm(24);
    font-weight: 700;
    color: var(--primary-color);
    margin-block-end: toEm(4);
  }

  &__faq-answer {
    padding: toEm(8) toEm(4);
  }
}
</style>
