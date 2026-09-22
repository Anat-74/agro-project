<script setup lang="ts">
import { gardenTranslations } from "~/locales/garden";
import { buttonTranslations } from "~/locales/button";
import ShowModalArticle from "~/components/show-modal/ShowModalArticle.vue";
import { calcPacks, calcPlantsOf, calcPlanting } from "~~/shared/utils/calc";

// Слайд «Посадка» панели каталога: «Что сажаем?» → расчёт (площадь → растения →
// семена/рассада/удобрение) и товары для выбранного растения.
interface Props {
  // Показывать блок «Частые вопросы». На странице калькулятора вопросы выводятся
  // отдельным блоком страницы (виден и на телефоне), чтобы не было дубля
  showFaq?: boolean;
}

const props = withDefaults(defineProps<Props>(), { showFaq: true });

const emit = defineEmits<{
  navigate: [];
}>();

const { currentLocale } = useLocale();
const { getProductLink } = useProductLink();
const cartStore = useCartStore();

const t = computed(() => gardenTranslations[currentLocale.value]);
const buttonT = computed(() => buttonTranslations[currentLocale.value]);

// Тип растения из Strapi (локально — глобального типа Crop нет)
interface GardenPlanting {
  rowSpacing?: number | null;
  plantSpacing?: number | null;
  seedsPerHole?: number | null;
  seedRatePerSqM?: number | null;
  seedRatePerPlant?: number | null;
  germination?: number | null;
  seedingDepth?: number | null;
}
interface GardenSeedling {
  plantsPerSqM?: number | null;
  growingDays?: number | null;
  sowingPeriod?: string | null;
  transplantPeriod?: string | null;
}
interface GardenFertilizing {
  ratePerSqM?: number | null;
  applications?: number | null;
  npk?: string | null;
  kind?: "mineral" | "organic" | string | null;
}
interface GardenCrop {
  documentId: string;
  name: string;
  slug?: string;
  image?: { url?: string; alternativeText?: string } | null;
  planting?: GardenPlanting | null;
  seedling?: GardenSeedling | null;
  fertilizing?: GardenFertilizing | null;
}

// Тип товара растения: глобальный Product + наше поле purpose
// (у глобального Product нет purpose, поэтому расширяем пересечением)
type GardenPurpose = "seeds" | "seedlings" | "fertilizer" | "other";
type GardenPackaging = { label?: string | null; amount?: number | null; unit?: string | null };
type GardenProduct = Product & {
  purpose?: GardenPurpose | null;
  packaging?: GardenPackaging[] | null;
  category?: { slug?: string } | null;
  subcategory?: { slug?: string } | null;
};

// ===== Растения (crop) =====
const cropKey = computed(() => `garden-crops-${currentLocale.value}`);
const { data: crops, pending: pendingCrops } = useCachedAsyncData(
  cropKey,
  async () => {
    const { find } = useStrapi();
    const response = await find<GardenCrop>("crops", {
      filters: {
        locale: { $eq: currentLocale.value },
        isActive: { $eq: true },
      },
      sort: ["name:asc"],
      pagination: { pageSize: 100 } as PaginationMeta,
      populate: {
        planting: true,
        seedling: true,
        fertilizing: true,
        image: { fields: ["alternativeText", "url"] },
      },
    } as any);
    return response.data || [];
  },
  { watch: [cropKey], server: false, ttl: 600_000 },
);

// ===== Выбор растения =====
const selectedId = ref<string | null>(null);
const selectedCrop = computed(
  () => crops.value?.find((c) => c.documentId === selectedId.value) || null,
);

// По умолчанию — первое растение
watch(
  crops,
  (list) => {
    const first = list?.[0];
    if (!selectedId.value && first) selectedId.value = first.documentId;
  },
  { immediate: true },
);

// ===== Статьи блога по выбранному растению (blog ↔ crop) =====
// Клик по статье: на телефоне/планшете открываем модальное окно (страница статьи
// остаётся для десктопа и поиска); кнопку «Рассчитать посадку» внутри не показываем —
// человек уже находится в калькуляторе
const articleModalRef = useTemplateRef<InstanceType<typeof ShowModalArticle>>("article-modal");
const { activeArticle, interceptArticleClick } = useArticleModal();

const onArticleClick = (item: ArticleLinkItem, event: MouseEvent) => {
  if (!interceptArticleClick(item, event)) return;
  nextTick(() => articleModalRef.value?.openModal());
};

const articlesKey = computed(
  () => `garden-articles-${currentLocale.value}-${selectedId.value ?? "none"}`,
);
const { data: articles } = useCachedAsyncData(
  articlesKey,
  async () => {
    if (!selectedId.value) return [];
    const { find } = useStrapi();
    const response = await find<{ documentId: string; title: string; slug: string; date?: string }>(
      "blogs",
      {
        filters: {
          locale: { $eq: currentLocale.value },
          crops: { documentId: { $eq: selectedId.value } },
        },
        sort: ["date:desc"],
        pagination: { pageSize: 10 } as PaginationMeta,
        fields: ["title", "slug", "date"],
      } as any,
    );
    return response.data || [];
  },
  { watch: [articlesKey], server: false, ttl: 600_000 },
);

// ===== FAQ раздела (calculator-page.faq) =====
// Один источник для страницы калькулятора и для слайда «Посадка» (≤ $tablet)
type GardenFaqItem = { question: string; answer: string };
// Ключ кэша разный для страницы и панели: на странице вопросы не грузим (их
// выводит сама страница), иначе пустой ответ из кэша попал бы и в панель
const faqKey = computed(
  () => `garden-faq-${currentLocale.value}-${props.showFaq ? "panel" : "page"}`,
);
const { data: faqItems } = useCachedAsyncData(
  faqKey,
  async () => {
    // На странице калькулятора вопросы выводятся самой страницей — запрос не нужен
    if (!props.showFaq) return [];
    const { find } = useStrapi();
    const response = await find<{ faq?: GardenFaqItem[] }>("calculator-page", {
      filters: { locale: { $eq: currentLocale.value } },
      populate: { faq: true },
    } as any);
    const entry: any = Array.isArray(response.data)
      ? response.data[0]
      : response.data;
    return (entry?.faq || []) as GardenFaqItem[];
  },
  { server: false, ttl: 600_000 },
);

// ===== Товары растения (по purpose) =====
const productsKey = computed(
  () => `garden-products-${currentLocale.value}-${selectedId.value ?? "none"}`,
);
const { data: products, pending: pendingProducts } = useCachedAsyncData(
  productsKey,
  async () => {
    if (!selectedId.value) return [];
    const { find } = useStrapi();
    const response = await find<GardenProduct>("products", {
      filters: {
        locale: { $eq: currentLocale.value },
        crop: { documentId: { $eq: selectedId.value } },
      },
      pagination: { pageSize: 100 } as PaginationMeta,
      populate: {
        mainImage: { fields: ["alternativeText", "url"] },
        image: { fields: ["alternativeText", "url"] },
        packaging: true,
        // нужны для getProductLink (категория/подкатегория → URL товара)
        category: { fields: ["slug"] },
        subcategory: {
          fields: ["slug"],
          populate: { category: { fields: ["slug"] } },
        },
      },
    } as any);
    return response.data || [];
  },
  { watch: [productsKey], server: false, ttl: 300_000 },
);

// ===== Калькулятор: режимы «Семена / Рассада / Удобрение» =====
type GardenMode = "seeds" | "seedlings" | "fertilizer";
const mode = ref<GardenMode>("seeds");
const area = ref(1);

const modeTabs = computed<{ id: GardenMode; label: string }[]>(() => [
  { id: "seeds", label: t.value.modeSeeds },
  { id: "seedlings", label: t.value.modeSeedlings },
  { id: "fertilizer", label: t.value.modeFertilizer },
]);

// Фасовки товаров растения по назначению → пачки для активного режима
const packagingsByPurpose = computed<Record<GardenMode, GardenPackaging[]>>(() => {
  const pick = (purpose: GardenPurpose) =>
    (products.value ?? [])
      .filter((p) => p.purpose === purpose)
      .flatMap((p) => p.packaging ?? [])
      .filter((pk) => pk?.amount)
      .map((pk) => ({ label: pk.label ?? "", amount: pk.amount ?? 0, unit: pk.unit ?? "g" }));
  return {
    seeds: pick("seeds"),
    seedlings: pick("seedlings"),
    fertilizer: pick("fertilizer"),
  };
});

const result = computed(() =>
  calcPlanting({
    mode: mode.value,
    areaSqm: area.value,
    planting: selectedCrop.value?.planting ?? null,
    seedling: selectedCrop.value?.seedling ?? null,
    fertilizing: selectedCrop.value?.fertilizing ?? null,
    packagings: packagingsByPurpose.value[mode.value],
  }),
);

// Есть ли данные растения под активный режим
const hasModeData = computed(() => {
  const crop = selectedCrop.value;
  if (!crop) return false;
  if (mode.value === "seedlings") return !!crop.seedling;
  if (mode.value === "fertilizer") return !!crop.fertilizing;
  return !!crop.planting;
});

// Дополнительные сведения режима: сроки рассады / формула и вид удобрения
const modeInfo = computed<{ label: string; value: string }[]>(() => {
  const crop = selectedCrop.value;
  if (!crop) return [];
  const rows: { label: string; value: string }[] = [];

  if (mode.value === "seedlings" && crop.seedling) {
    const { growingDays, sowingPeriod, transplantPeriod } = crop.seedling;
    if (growingDays) {
      rows.push({
        label: t.value.growingDays,
        value: `${growingDays} ${t.value.unitDay}`,
      });
    }
    if (sowingPeriod) {
      rows.push({ label: t.value.sowingLabel, value: sowingPeriod });
    }
    if (transplantPeriod) {
      rows.push({ label: t.value.transplantLabel, value: transplantPeriod });
    }
  }

  if (mode.value === "fertilizer" && crop.fertilizing) {
    const { npk, kind } = crop.fertilizing;
    if (npk) rows.push({ label: t.value.npkLabel, value: npk });
    if (kind) {
      rows.push({
        label: t.value.kindLabel,
        value: kind === "organic" ? t.value.kindOrganic : t.value.kindMineral,
      });
    }
  }

  return rows;
});

// Растений для штучных фасовок рассады: считаем по плотности рассады
// (независимо от активного режима), иначе — по схеме посева
const seedlingPlants = computed(() =>
  calcPlantsOf({
    mode: "seedlings",
    areaSqm: area.value,
    planting: selectedCrop.value?.planting ?? null,
    seedling: selectedCrop.value?.seedling ?? null,
  }),
);

// Сколько пачек этого товара нужно по расчёту. Основа — НАЗНАЧЕНИЕ товара
// (а не активный режим): семена считаем по граммам семян, удобрение — по
// граммам удобрения, рассаду — по растениям (штучные фасовки).
const packCountFor = (product: GardenProduct): number => {
  const base =
    product.purpose === "fertilizer"
      ? result.value.fertilizerGrams
      : product.purpose === "seedlings"
        ? null
        : result.value.seedGrams;
  const plants = product.purpose === "seedlings" ? seedlingPlants.value : result.value.plants;
  const packs = calcPacks(base, product.packaging ?? null, plants);
  return packs?.[0]?.count ?? 1;
};

// Сколько единиц этого товара уже лежит в корзине (для состояния кнопки и счётчика)
const cartQtyFor = (documentId: string): number =>
  cartStore.items.find((item) => item.product.documentId === documentId)?.quantity ?? 0;

// «В корзину» из расчёта: добавляем сразу N пачек этого товара
const addProductToCart = (product: GardenProduct) => {
  cartStore.addToCart(
    product,
    product.category?.slug ?? "",
    product.subcategory?.slug ?? null,
    packCountFor(product),
  );
};

// Группы <details> уникальны для каждого инстанса компонента: страница и панель
// живут в одном документе, а name у details склеивает их группы НА ВЕСЬ документ
// (открытие в панели закрывало бы пункт на странице)
const faqGroupId = useId();

type Purpose = GardenPurpose;
const purposeGroups = computed(() => {
  const groups: Record<Purpose, GardenProduct[]> = {
    seeds: [],
    seedlings: [],
    fertilizer: [],
    other: [],
  };
  for (const p of products.value ?? []) {
    const purpose: Purpose = p.purpose ?? "other";
    (groups[purpose] ?? groups.other).push(p);
  }
  const label: Record<Purpose, string> = {
    seeds: t.value.purposeSeeds,
    seedlings: t.value.purposeSeedlings,
    fertilizer: t.value.purposeFertilizer,
    other: t.value.purposeOther,
  };
  return (["seeds", "seedlings", "fertilizer", "other"] as Purpose[])
    .map((id) => ({ id, label: label[id], items: groups[id] }))
    .filter((g) => g.items.length);
});
</script>

<template>
  <div class="hamburger-garden">
    <header class="hamburger-garden__head">
      <h2 class="hamburger-garden__title">{{ t.title }}</h2>
      <p class="hamburger-garden__subtitle">{{ t.subtitle }}</p>
    </header>

    <!-- Что сажаем? -->
    <section class="hamburger-garden__section">
      <h3 class="hamburger-garden__question">{{ t.question }}</h3>

      <!-- Растения. Данные приходят только на клиенте, поэтому во время загрузки
           показываем общий индикатор проекта (ULoader показывает себя сам) -->
      <ULoader v-show="pendingCrops" />

      <div v-if="crops?.length" class="hamburger-garden__chips">
        <UButton
          v-for="crop in crops"
          :key="crop.documentId"
          variant="plain"
          class="hamburger-garden__chip"
          :class="{ 'hamburger-garden__chip_is-active': crop.documentId === selectedId }"
          :aria-pressed="crop.documentId === selectedId"
          @click="selectedId = crop.documentId"
        >
          <UImage
            v-if="crop.image?.url"
            :src="crop.image.url"
            :alt="crop.image.alternativeText || ''"
            class="hamburger-garden__chip-image"
            width="24"
            height="24"
            type="icon"
          />
          <span>{{ crop.name }}</span>
        </UButton>
      </div>

      <p v-else-if="!pendingCrops" class="hamburger-garden__empty">
        {{ t.emptyCrops }}
      </p>
    </section>

    <!-- Калькулятор -->
    <section v-if="selectedCrop" class="hamburger-garden__section">
      <div
        class="hamburger-garden__modes"
        role="tablist"
        :aria-label="t.calcModes"
      >
        <UButton
          v-for="tab in modeTabs"
          :key="tab.id"
          variant="plain"
          role="tab"
          class="hamburger-garden__mode"
          :class="{ 'hamburger-garden__mode_is-active': mode === tab.id }"
          :aria-selected="mode === tab.id"
          @click="mode = tab.id"
        >
          {{ tab.label }}
        </UButton>
      </div>

      <label class="hamburger-garden__field">
        <span class="hamburger-garden__field-label">{{ t.areaLabel }}</span>
        <span class="hamburger-garden__field-input">
          <input
            v-model.number="area"
            type="number"
            min="0.1"
            step="0.1"
            inputmode="decimal"
            class="hamburger-garden__input"
            :aria-label="`${t.areaLabel}, ${t.areaUnit}`"
          >
          <span class="hamburger-garden__field-unit">{{ t.areaUnit }}</span>
        </span>
      </label>

      <p v-if="!hasModeData" class="hamburger-garden__empty">{{ t.noData }}</p>

      <dl v-if="hasModeData" class="hamburger-garden__result">
        <div v-if="result.plants !== null" class="hamburger-garden__result-row">
          <dt>{{ mode === "seedlings" ? t.modeSeedlings : t.plants }}</dt>
          <dd>{{ result.plants }}</dd>
        </div>
        <div
          v-if="mode === 'seeds' && result.seedGrams !== null"
          class="hamburger-garden__result-row"
        >
          <dt>{{ t.seeds }}</dt>
          <dd>~{{ result.seedGrams }} {{ t.unitGram }}</dd>
        </div>
        <div
          v-if="mode === 'fertilizer' && result.fertilizerGrams !== null"
          class="hamburger-garden__result-row"
        >
          <dt>{{ t.fertilizer }}</dt>
          <dd>~{{ result.fertilizerGrams }} {{ t.unitGram }}</dd>
        </div>
        <div v-if="result.packs?.length" class="hamburger-garden__result-row">
          <dt>{{ t.packs }}</dt>
          <dd>{{ result.packs.map((pack) => `${pack.label} × ${pack.count}`).join(", ") }}</dd>
        </div>
        <div
          v-for="row in modeInfo"
          :key="row.label"
          class="hamburger-garden__result-row"
        >
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>
    </section>

    <!-- Товары растения -->
    <section v-if="selectedCrop" class="hamburger-garden__section">
      <h3 class="hamburger-garden__question">{{ t.productsTitle }}</h3>

      <div v-if="purposeGroups.length" class="hamburger-garden__groups">
        <div v-for="group in purposeGroups" :key="group.id" class="hamburger-garden__group">
          <h4 class="hamburger-garden__group-title">{{ group.label }}</h4>
          <ul class="hamburger-garden__list">
            <li
              v-for="prod in group.items"
              :key="prod.documentId"
              class="hamburger-garden__product-item"
            >
              <NuxtLink
                class="hamburger-garden__product accordion__summary"
                :to="getProductLink(prod)"
                @click="emit('navigate')"
              >
                <UImage
                  v-if="prod.mainImage?.url || prod.image?.length"
                  :src="prod.mainImage?.url || prod.image?.[0]?.url"
                  alt=""
                  class="accordion__product-image-link"
                  width="32"
                  height="32"
                  type="icon"
                />
                <span class="hamburger-garden__product-name">{{ prod.name }}</span>
              </NuxtLink>
              <!-- Кнопка добавления в корзину: иконка корзины, а количество
                   добавленного — счётчиком НАД кнопкой (абсолютное позиционирование,
                   поэтому соседние элементы не сдвигаются) -->
              <UButton
                variant="plain"
                class="hamburger-garden__add"
                :class="{ 'hamburger-garden__add_in-cart': cartQtyFor(prod.documentId) > 0 }"
                :aria-label="
                  cartQtyFor(prod.documentId) > 0
                    ? `${buttonT.addedIsCart}: ${prod.name}`
                    : `${buttonT.label}: ${prod.name}`
                "
                @click="addProductToCart(prod)"
              >
                <Icon name="cil:cart" />
                <span
                  v-if="cartQtyFor(prod.documentId) > 0"
                  class="hamburger-garden__add-count"
                >{{ cartQtyFor(prod.documentId) }}</span>
              </UButton>
            </li>
          </ul>
        </div>
      </div>

      <ULoader v-show="pendingProducts" />

      <p v-if="!pendingProducts && !purposeGroups.length" class="hamburger-garden__empty">
        {{ t.emptyProducts }}
      </p>
    </section>

    <!-- Статьи блога по растению -->
    <section v-if="selectedCrop && articles?.length" class="hamburger-garden__section">
      <h3 class="hamburger-garden__question">{{ t.articlesTitle }}</h3>
      <ul class="hamburger-garden__list">
        <!-- Клик перехватываем на li (фаза перехвата): на телефоне откроется
             модалка, на десктопе ссылка сработает как обычно -->
        <li
          v-for="article in articles"
          :key="article.documentId"
          @click.capture="onArticleClick(article, $event)"
        >
          <NuxtLink
            class="hamburger-garden__article"
            :to="`/${currentLocale}/blog/${article.slug}`"
          >
            <Icon name="mingcute:document-line" />
            <span>{{ article.title }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Модальное окно статьи (страница — для десктопа и поиска, модалка — для телефона) -->
    <ShowModalArticle
      ref="article-modal"
      :slug="activeArticle?.slug"
      :title="activeArticle?.title"
      :date="activeArticle?.date"
      :show-calculator="false"
    />

    <!-- Частые вопросы: тот же источник (calculator-page.faq), что и на странице -->
    <section v-if="showFaq && faqItems?.length" class="hamburger-garden__section">
      <h3 class="hamburger-garden__question">{{ t.faqTitle }}</h3>
      <UAccordion
        v-for="(item, index) in faqItems"
        :key="index"
        :name="`garden-faq-${faqGroupId}-${index}`"
      >
        <template #header>
          <h4 class="hamburger-garden__faq-question">{{ item.question }}</h4>
        </template>
        <div class="hamburger-garden__faq-answer">
          <div class="hamburger-garden__faq-text">
            <MDC :value="item.answer" />
          </div>
        </div>
      </UAccordion>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.hamburger-garden {
  display: flex;
  flex-direction: column;
  row-gap: toEm(16);
  min-height: 100%;

  // Шапка слайда: заголовок + подзаголовок
  &__head {
    display: flex;
    flex-direction: column;
    row-gap: toEm(2);
  }

  &__title {
    font-size: toEm(22);
    font-weight: 700;
    color: var(--primary-color);
  }

  &__subtitle {
    font-size: toEm(15);
    color: var(--gray-color);
  }

  &__section {
    display: flex;
    flex-direction: column;
    row-gap: toEm(10);
  }

  &__question {
    font-size: toEm(18);
    font-weight: 600;
    color: var(--primary-color);
  }

  // Растения — чипы
  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: toEm(8);
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    column-gap: toEm(6);
    padding: toEm(6) toEm(12);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(20);
    background-color: var(--light-color);
    color: var(--color);
    font-weight: 600;
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration),
      background-color var(--transition-duration);

    &_is-active {
      color: var(--light-color);
      background-color: var(--green-color);
      border-color: var(--green-color);
    }

    @include hover {
      border-color: var(--green-color);
    }
  }

  // Изображение растения в чипе (круглое)
  &__chip-image {
    flex-shrink: 0;

    :deep(img) {
      width: toRem(24);
      height: toRem(24);
      border-radius: 50%;
    }
  }

  // Режимы расчёта (семена / рассада / удобрение)
  &__modes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: toEm(4);
    padding: toEm(4);
    border-radius: toRem(10);
    background-color: var(--light-color-transparent);
  }

  &__mode {
    // Делитель 14 — собственный шрифт кнопки (ниже font-size)
    padding: toEm(6, 14) toEm(8, 14);
    border-radius: toRem(8);
    background-color: transparent;
    color: var(--gray-color);
    font-size: toEm(14);
    font-weight: 600;
    transition:
      color var(--transition-duration),
      background-color var(--transition-duration);

    &_is-active {
      color: var(--light-color);
      background-color: var(--green-color);
    }

    @include hover {
      color: var(--primary-color);
    }
  }

  // Площадь
  &__field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: toEm(10);
  }

  &__field-label {
    font-weight: 600;
    color: var(--color);
  }

  &__field-input {
    display: flex;
    align-items: center;
    column-gap: toEm(6);
  }

  &__input {
    width: toRem(84);
    padding: toEm(6) toEm(10);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(8);
    text-align: right;
    color: var(--color);
    background-color: var(--light-color);
  }

  &__field-unit {
    color: var(--gray-color);
  }

  // Результат
  &__result {
    display: flex;
    flex-direction: column;
    row-gap: toEm(6);
    padding: toEm(10) toEm(12);
    border-radius: toRem(8);
    background-color: var(--light-color-transparent);
  }

  &__result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: toEm(10);

    dt {
      color: var(--gray-color);
    }

    dd {
      font-weight: 700;
      color: var(--primary-color);
    }
  }

  // Товары
  &__groups {
    display: flex;
    flex-direction: column;
    row-gap: toEm(12);
  }

  &__group-title {
    font-size: toEm(15);
    font-weight: 600;
    color: var(--gray-color);
    margin-block-end: toEm(4);
  }

  &__list {
    display: flex;
    flex-direction: column;
    row-gap: toEm(4);
  }

  // Товар: название (1fr) + кнопка добавления в корзину
  &__product-item {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: toEm(6);
  }

  // Кнопка добавления в корзину: иконка корзины, при добавлении — заливка
  &__add {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: toRem(34);
    height: toRem(34);
    border: toRem(1) solid var(--success-color);
    border-radius: toRem(8);
    color: var(--green-color);
    font-size: toRem(18);
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration),
      background-color var(--transition-duration);

    &_in-cart {
      border-color: var(--success-color);
      background-color: var(--success-color);
      color: var(--light-color);
    }

    @include hover {
      border-color: var(--warning-hover);
      color: var(--warning-hover);
    }
  }

  // Счётчик добавленного — НАД кнопкой: абсолютное позиционирование, поэтому
  // кнопка не растёт и соседние элементы не сдвигаются
  &__add-count {
    position: absolute;
    top: toRem(-7);
    right: toRem(-7);
    min-width: toRem(18);
    padding-inline: toRem(4);
    border-radius: toRem(9);
    background-color: var(--danger-color);
    color: var(--light-color);
    font-size: toRem(11);
    font-weight: 700;
    line-height: toRem(18);
    text-align: center;
    pointer-events: none;
  }

  // Частые вопросы (тот же аккордеон, что в каталоге и меню)
  &__faq-question {
    // Родитель — аккордеон проекта со шрифтом 22px, поэтому делитель указываем
    // явно: без него toEm(16) дал бы 22px (em считается от родителя)
    font-size: toEm(16, 22);
    font-weight: 600;
    text-align: left;
  }

  &__faq-answer {
    // ОБЯЗАТЕЛЬНО: контент аккордеона — сосед <details>, схлопывание
    // (grid-template-rows: 0fr) работает только если у ребёнка overflow: hidden,
    // иначе ответ виден всегда и раскрытие «не работает» (как в каталоге:
    // .accordion__product-list)
    overflow: hidden;
  }

  // Отступы — на самом ответе, а не на обёртке: паддинг обёртки не схлопывается
  // и у закрытого вопроса оставалась бы видимая полоса
  &__faq-text {
    padding: toEm(8) toEm(4);
  }

  &__product {
    justify-content: flex-start;
    column-gap: toEm(8);
    text-decoration: none;
  }

  &__product-name {
    text-align: left;
  }

  // Ссылка на статью по растению
  &__article {
    display: flex;
    align-items: center;
    column-gap: toEm(6);
    padding-block: toEm(2);
    color: var(--color);
    text-decoration: none;

    @include hover {
      color: var(--green-color);
      text-decoration: underline;
    }
  }

  &__empty {
    color: var(--gray-color);
    font-style: italic;
    @include adaptiveValue("font-size", 14, 12);
  }
}
</style>
