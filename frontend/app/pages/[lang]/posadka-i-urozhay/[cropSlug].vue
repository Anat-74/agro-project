<script setup lang="ts">
import { breadcrumbsTranslations } from "~/locales/breadcrumbs";
import { gardenTranslations } from "~/locales/garden";
import { GARDEN_SECTION } from "~/utils/calcSections";
import CalcSection from "~/components/show-modal/CalcSection.vue";

// Страница растения раздела «Посадка»: описание культуры, калькулятор с
// предвыбранным растением, FAQ раздела и перелинковка на другие растения.
// Данные — из Strapi (`crop`), разметка/SEO собираются здесь.
const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();
const config = useRuntimeConfig();
const t = computed(() => gardenTranslations[currentLocale.value]);

const cropSlug = computed(() => String(route.params.cropSlug || ""));

interface GardenCropPage {
  documentId: string;
  name: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  image?: { url?: string; alternativeText?: string } | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    structuredData?: unknown;
  } | null;
}

const cropKey = computed(() => `crop-page-${currentLocale.value}-${cropSlug.value}`);
// await: странице нужны данные до рендера (404 для несуществующего slug, SEO-мета)
const { data: crop } = await useAsyncData(cropKey, async () => {
  const response = await find<GardenCropPage>("crops", {
    filters: {
      locale: { $eq: currentLocale.value },
      slug: { $eq: cropSlug.value },
      isActive: { $eq: true },
    },
    populate: { image: { fields: ["alternativeText", "url"] }, seo: true },
    pagination: { pageSize: 1 },
  } as any);
  return (response?.data?.[0] as GardenCropPage) || null;
});

if (!crop.value) {
  throw createError({ statusCode: 404, statusMessage: "Crop not found" });
}

// Другие растения раздела — перелинковка (внутренние ссылки для поиска)
const othersKey = computed(() => `crop-page-others-${currentLocale.value}`);
const { data: otherCrops } = useAsyncData(othersKey, async () => {
  const response = await find<{ documentId: string; name: string; slug?: string }>("crops", {
    filters: { locale: { $eq: currentLocale.value }, isActive: { $eq: true } },
    fields: ["name", "slug"],
    sort: ["name:asc"],
    pagination: { pageSize: 20 },
  } as any);
  return (response?.data || []) as { documentId: string; name: string; slug?: string }[];
});

// FAQ раздела (как на хабе) — из calculator-page
const faqKey = computed(() => `crop-page-faq-${currentLocale.value}`);
const { data: faq } = useAsyncData(faqKey, async () => {
  const response: any = await find("calculator-page", {
    filters: { locale: { $eq: currentLocale.value } },
    populate: { faq: true },
  } as any);
  const page = response?.data?.[0] || response?.data || null;
  return (page?.faq || []) as { question: string; answer: string }[];
});

const title = computed(
  () => crop.value?.seo?.metaTitle || `${crop.value?.name} — посадка и уход`,
);
const description = computed(
  () => crop.value?.seo?.metaDescription || crop.value?.shortDescription || t.value.subtitle,
);
const pageUrl = computed(() => `${config.public.siteUrl}${route.fullPath}`);

// Хлебные крошки: «Главную» рендерит сам UBreadcrumbs
const breadcrumbItems = computed(() => [
  { label: t.value.title, to: `/${currentLocale.value}/posadka-i-urozhay` },
  { label: crop.value?.name || "" },
]);

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  ogUrl: pageUrl,
  ogImage: `${config.public.siteUrl}/pwa-512x512.png`,
});

const schemaOrgNodes = computed<any[]>(() => {
  const nodes: any[] = [
    defineWebPage({
      name: title.value,
      description: description.value,
      url: pageUrl.value,
      inLanguage: currentLocale.value,
    }),
    defineBreadcrumb({
      itemListElement: [
        {
          name: breadcrumbsTranslations[currentLocale.value].home,
          item: `${config.public.siteUrl}/${currentLocale.value}`,
        },
        {
          name: t.value.title,
          item: `${config.public.siteUrl}/${currentLocale.value}/posadka-i-urozhay`,
        },
        { name: crop.value?.name || "", item: pageUrl.value },
      ],
    }),
  ];
  if (crop.value?.seo?.structuredData) nodes.push(crop.value.seo.structuredData);
  return nodes;
});

useSchemaOrg(schemaOrgNodes);

// ≤ $tablet: калькулятор открывается в панели каталога на вкладке «Посадка»
const { requestOpen } = useGardenDialog();
</script>

<template>
  <section v-if="crop" class="crop-page" aria-labelledby="crop-page-title">
    <div class="crop-page__container">
      <UBreadcrumbs :items="breadcrumbItems" />

      <div class="crop-page__hero">
        <NuxtPicture
          v-if="crop.image?.url"
          :src="crop.image.url"
          :alt="crop.image.alternativeText || crop.name"
          class="crop-page__image"
          format="webp"
          sizes="100vw sm:50vw"
        />
        <div class="crop-page__info">
          <h1 id="crop-page-title" class="crop-page__title">{{ crop.name }}</h1>
          <p v-if="crop.shortDescription" class="crop-page__subtitle">
            {{ crop.shortDescription }}
          </p>

          <!-- ≤ $tablet: открываем панель сразу на вкладке «Посадка» -->
          <UButton variant="plain" class="crop-page__open visible-tablet" @click="requestOpen">
            <Icon name="cil:calculator" />
            {{ t.calculatorCta }}
          </UButton>
        </div>
      </div>

      <div v-if="crop.description" class="crop-page__intro">
        <MDC :value="crop.description" />
      </div>

      <!-- Калькулятор с предвыбранным растением: только выше планшета -->
      <CalcSection
        class="crop-page__section hidden-tablet"
        :section="GARDEN_SECTION"
        :initial-item-id="crop.documentId"
        :show-faq="false"
      />

      <!-- Другие растения раздела -->
      <section v-if="otherCrops?.length" class="crop-page__others">
        <h2 class="crop-page__others-title">{{ t.otherPlants }}</h2>
        <ul class="crop-page__others-list">
          <li v-for="other in otherCrops" :key="other.documentId">
            <NuxtLink
              v-if="other.slug"
              class="crop-page__other"
              :to="`/${currentLocale}/posadka-i-urozhay/${other.slug}`"
            >
              {{ other.name }}
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- FAQ раздела: разметку FAQPage отдаём в JSON-LD -->
      <section v-if="faq?.length" class="crop-page__faq">
        <h2 class="crop-page__faq-title">{{ t.faqTitle }}</h2>
        <UAccordion
          v-for="(item, index) in faq"
          :key="index"
          :name="`crop-faq-${index}`"
        >
          <template #header>
            <h3 class="crop-page__faq-question">{{ item.question }}</h3>
          </template>
          <div class="crop-page__faq-answer">
            <div class="crop-page__faq-text">
              <MDC :value="item.answer" />
            </div>
          </div>
        </UAccordion>
      </section>

      <!-- Скрытый SEO-блок: растение и режимы расчёта — для поиска и скринридеров -->
      <section class="visually-hidden">
        <h2>{{ crop.name }}</h2>
        <p>{{ crop.shortDescription }}</p>
        <h3>{{ t.seoPlantsTitle }}</h3>
        <ul>
          <li v-for="other in otherCrops" :key="other.documentId">{{ other.name }}</li>
        </ul>
        <h3>{{ t.seoModesTitle }}</h3>
        <ul>
          <li>{{ t.modeSeeds }}</li>
          <li>{{ t.modeSeedlings }}</li>
          <li>{{ t.modeFertilizer }}</li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.crop-page {
  padding-block: toEm(32);

  &__container {
    display: flex;
    flex-direction: column;
    row-gap: toEm(20);
  }

  // Hero: изображение + название и краткое описание
  &__hero {
    display: grid;
    gap: toEm(16);
    align-items: center;

    @media (min-width: toEm(640)) {
      grid-template-columns: toRem(320) 1fr;
      column-gap: toEm(24);
    }
  }

  &__image {
    width: 100%;
    border-radius: toRem(12);
    object-fit: contain;
  }

  &__info {
    display: flex;
    flex-direction: column;
    row-gap: toEm(12);
    align-items: flex-start;
  }

  &__subtitle {
    color: var(--gray-color);
  }

  &__open {
    display: inline-flex;
    align-items: center;
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

  // Другие растения
  &__others {
    display: flex;
    flex-direction: column;
    row-gap: toEm(10);
  }

  &__others-list {
    display: flex;
    flex-wrap: wrap;
    gap: toEm(8);
  }

  &__other {
    display: inline-flex;
    padding: toEm(8) toEm(12);
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

  // FAQ (аккордеон проекта)
  &__faq {
    display: flex;
    flex-direction: column;
    row-gap: toEm(6);
  }

  &__faq-question {
    // Родитель — аккордеон со своим шрифтом, делитель указываем явно
    font-size: toEm(16, 22);
    font-weight: 600;
    text-align: left;
  }

  &__faq-answer {
    // Схлопывание контента аккордеона работает только с overflow: hidden
    overflow: hidden;
  }

  &__faq-text {
    padding: toEm(8) toEm(4);
  }
}
</style>
