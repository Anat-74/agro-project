<script setup lang="ts">
import { gardenTranslations } from "~/locales/garden";
import { buttonTranslations } from "~/locales/button";
import ShowModalArticle from "~/components/show-modal/ShowModalArticle.vue";
import ShowModalProduct from "~/components/show-modal/ShowModalProduct.vue";
import { calcPacks, calcPlantsOf, calcPlanting } from "~~/shared/utils/calc";

// Слайд «Посадка» панели каталога: «Что сажаем?» → расчёт (площадь → растения →
// семена/рассада/удобрение) и товары для выбранного растения.
interface Props {
  // Показывать блок «Частые вопросы». На странице калькулятора вопросы выводятся
  // отдельным блоком страницы (виден и на телефоне), чтобы не было дубля
  showFaq?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showFaq: true,
});

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

// Ссылка на товар: на телефоне и планшете открываем окно товара, а не переходим
// на страницу (страница остаётся для десктопа и поисковых систем, ссылка —
// настоящая, поэтому роботы по ней ходят). Модалка сама догружает товар по его
// адресу тем же ключом кэша, что и страница товара
const { width } = useViewport();
const productModalRef = useTemplateRef<InstanceType<typeof ShowModalProduct>>("product-modal");
const activeProduct = ref<GardenProduct | null>(null);

const onProductClick = (product: GardenProduct, event: MouseEvent) => {
  if (!width.value || width.value > 1024) return;
  // Перехватываем только клик по самой ссылке: кнопка «добавить в корзину»
  // стоит в той же строке и не должна открывать окно товара
  const clickedLink = (event.target as Element | null)?.closest("a");
  if (!clickedLink) return;
  // Останавливаем событие: ссылка не проверяет preventDefault и всё равно
  // выполнила бы переход — клик не должен до неё дойти
  event.stopPropagation();
  event.preventDefault();
  activeProduct.value = product;
  nextTick(() => productModalRef.value?.openModal?.());
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

// Иконка по назначению: используется и в табах режимов, и в подписях групп товаров
const PURPOSE_ICONS: Record<Purpose, string> = {
  seeds: "mdi:seed-outline",
  seedlings: "mdi:sprout-outline",
  fertilizer: "mingcute:flask-2-line",
  other: "mingcute:basket-2-line",
};
// ===== Площадь: храним всегда в м², а показываем в выбранной единице =====
// 1 сотка = 100 м². Пользователь вводит значение в выбранной единице,
// в расчёт всегда уходит м²
type AreaUnit = "sqm" | "sotka";
const AREA_UNIT_FACTOR: Record<AreaUnit, number> = { sqm: 1, sotka: 100 };
const areaUnit = ref<AreaUnit>("sqm");
const areaSqm = ref(1);

const areaUnitTabs = computed<{ id: AreaUnit; label: string }[]>(() => [
  { id: "sqm", label: t.value.areaUnitSqm },
  // В табе — «сотки», а рядом с полем подпись «соток» (например, «5 соток»)
  { id: "sotka", label: t.value.areaUnitSotkaTab },
]);

// Подпись единицы рядом с полем (м² / соток)
const areaUnitLabel = computed(() =>
  areaUnit.value === "sotka" ? t.value.areaUnitSotka : t.value.areaUnitSqm,
);

// Значение для поля ввода: показываем в выбранной единице
const areaInput = computed<number>({
  get: () => areaSqm.value / AREA_UNIT_FACTOR[areaUnit.value],
  set: (value) => {
    const num = Number(value);
    areaSqm.value = Number.isFinite(num) && num > 0 ? num * AREA_UNIT_FACTOR[areaUnit.value] : 0;
  },
});

const modeTabs = computed<{ id: GardenMode; label: string; icon: string }[]>(() => [
  { id: "seeds", label: t.value.modeSeeds, icon: PURPOSE_ICONS.seeds },
  { id: "seedlings", label: t.value.modeSeedlings, icon: PURPOSE_ICONS.seedlings },
  { id: "fertilizer", label: t.value.modeFertilizer, icon: PURPOSE_ICONS.fertilizer },
]);

// Слайдер расчёта: табы = слайды. Клик по табу переключает слайд,
// свайп слайдера обновляет активный таб (как в слайдере панели)
const calcSlider = useTemplateRef("calc-slider");

const selectMode = (id: GardenMode) => {
  mode.value = id;
  const index = modeTabs.value.findIndex((tab) => tab.id === id);
  if (index >= 0) calcSlider.value?.go(index + 1);
};

const onCalcSlide = (n: number) => {
  const tab = modeTabs.value[n - 1];
  if (tab) mode.value = tab.id;
};

// Свайп по блоку расчёта: зона шире самого слайдера (табы, поле площади,
// таблица). Механику даёт USlider (nested + swipeBy) — здесь только жест
const calcSwipeX = ref<number | null>(null);
const calcSwipeY = ref<number | null>(null);

const onCalcSwipeStart = (e: TouchEvent) => {
  calcSwipeX.value = e.touches[0]?.clientX ?? null;
  calcSwipeY.value = e.touches[0]?.clientY ?? null;
};

const onCalcSwipeEnd = (e: TouchEvent) => {
  const startX = calcSwipeX.value;
  const startY = calcSwipeY.value;
  calcSwipeX.value = null;
  calcSwipeY.value = null;
  if (startX === null || startY === null) return;
  const touch = e.changedTouches[0];
  calcSlider.value?.swipeBy(
    (touch?.clientX ?? startX) - startX,
    (touch?.clientY ?? startY) - startY,
  );
};

const onCalcSwipeCancel = () => {
  calcSwipeX.value = null;
  calcSwipeY.value = null;
};

// Подписи фасовок для слайда: в шаблоне обращаться к packs напрямую небезопасно
// (тип допускает undefined — редактор подчёркивал выражение)
const packsLabel = (m: GardenMode) =>
  (resultFor(m).packs ?? [])
    .map((pack) => `${pack.label} × ${pack.count}`)
    .join(", ");

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

// Расчёт по КОНКРЕТНОМУ режиму — нужен слайдам (каждый слайд = режим расчёта)
const resultFor = (m: GardenMode) =>
  calcPlanting({
    mode: m,
    areaSqm: areaSqm.value,
    planting: selectedCrop.value?.planting ?? null,
    seedling: selectedCrop.value?.seedling ?? null,
    fertilizing: selectedCrop.value?.fertilizing ?? null,
    packagings: packagingsByPurpose.value[m],
  });

// Расчёт активного режима (для товаров и логики вне слайдера)
const result = computed(() => resultFor(mode.value));

// Есть ли данные растения под конкретный режим
const hasModeDataFor = (m: GardenMode) => {
  const crop = selectedCrop.value;
  if (!crop) return false;
  if (m === "seedlings") return !!crop.seedling;
  if (m === "fertilizer") return !!crop.fertilizing;
  return !!crop.planting;
};

// Есть ли данные растения под активный режим — считаем по слайду (см. шаблон)

// Дополнительные сведения КОНКРЕТНОГО режима: сроки рассады / формула и вид удобрения
const modeInfoFor = (m: GardenMode): { label: string; value: string }[] => {
  const crop = selectedCrop.value;
  if (!crop) return [];
  const rows: { label: string; value: string }[] = [];

  if (m === "seedlings" && crop.seedling) {
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

  if (m === "fertilizer" && crop.fertilizing) {
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
};

// Сведения активного режима считаются по слайду (см. шаблон)

// Растений для штучных фасовок рассады: считаем по плотности рассады
// (независимо от активного режима), иначе — по схеме посева
const seedlingPlants = computed(() =>
  calcPlantsOf({
    mode: "seedlings",
    areaSqm: areaSqm.value,
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

// Группы <details> уникальны для каждого инстанса компонента: страница и панель// живут в одном документе, а name у details склеивает их группы НА ВЕСЬ документ
// (открытие в панели закрывало бы пункт на странице)
// Группы товаров: первые GROUP_PREVIEW позиций видны сразу, остальные свёрнуты
// и раскрываются по шеврону «показать все» (решение 25.09).
// Анимация раскрытия — как у разделов аккордеона: grid-template-rows 0fr → 1fr
const GROUP_PREVIEW = 2;
const expandedGroups = ref<Set<number>>(new Set());
const toggleGroupProducts = (index: number) => {
  const next = new Set(expandedGroups.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  expandedGroups.value = next;
};

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
    .map((id) => ({ id, label: label[id], icon: PURPOSE_ICONS[id], items: groups[id] }))
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
      <h3 class="hamburger-garden__question">
        <Icon name="mdi:sprout-outline" class="hamburger-garden__question-icon" />
        {{ t.question }}
      </h3>

      <!-- Растения. Данные приходят только на клиенте, поэтому во время загрузки
           показываем общий индикатор проекта (ULoader показывает себя сам) -->
      <ULoader v-show="pendingCrops" />

      <div v-if="crops?.length" class="hamburger-garden__chips">
        <UButton
          v-for="crop in crops"
          :key="crop.documentId"
          variant="plain"
          :class="[
            'hamburger-garden__chip',
            { 'hamburger-garden__chip_is-active': crop.documentId === selectedId },
          ]"
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
    <section
      v-if="selectedCrop"
      class="hamburger-garden__section hamburger-garden__section_calc"
      @touchstart.passive="onCalcSwipeStart"
      @touchend="onCalcSwipeEnd"
      @touchcancel="onCalcSwipeCancel"
    >
      <h3 class="hamburger-garden__question">
        <Icon name="mdi:calculator-variant-outline" class="hamburger-garden__question-icon" />
        {{ t.calcHeading }}
      </h3>

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
          :class="[
            'hamburger-garden__mode',
            { 'hamburger-garden__mode_is-active': mode === tab.id },
          ]"
          :aria-selected="mode === tab.id"
          @click="selectMode(tab.id)"
        >
          <Icon :name="tab.icon" />
          {{ tab.label }}
        </UButton>
      </div>

      <!-- Площадь: подпись с иконкой слева, единицы (м² / сотки) справа -->
      <div class="hamburger-garden__units-row">
        <span class="hamburger-garden__field-label">
          <Icon name="mdi:ruler-square" class="hamburger-garden__label-icon" />
          {{ t.areaLabel }}
        </span>

        <div
          class="hamburger-garden__units"
          role="radiogroup"
          :aria-label="t.areaUnits"
        >
          <UButton
            v-for="unit in areaUnitTabs"
            :key="unit.id"
            variant="plain"
            role="radio"
            :class="[
              'hamburger-garden__unit',
              { 'hamburger-garden__unit_is-active': areaUnit === unit.id },
            ]"
            :aria-checked="areaUnit === unit.id"
            @click="areaUnit = unit.id"
          >
            {{ unit.label }}
          </UButton>
        </div>
      </div>

      <!-- Поле ввода площади (справа) и единица измерения -->
      <div class="hamburger-garden__field">
        <UInput
          v-model.number="areaInput"
          type="number"
          :min="0.1"
          :step="0.1"
          clear-on-focus
          :aria-label="`${t.areaLabel}, ${areaUnitLabel}`"
          class="hamburger-garden__input"
        />
        <span class="hamburger-garden__field-unit">{{ areaUnitLabel }}</span>
      </div>

      <!-- Расчёт: слайдер по режимам — тот же паттерн, что у слайдера панели
           (USlider). Табы выше переключают слайды, внизу по центру — точки -->
      <USlider
        ref="calc-slider"
        nested
        :slides="modeTabs"
        slide-key="id"
        variant="background"
        height="auto"
        :show-navigation="false"
        class="hamburger-garden__calc-slider"
        @update:active="onCalcSlide"
      >
        <template #default="{ slide }">
          <p v-if="!hasModeDataFor(slide.id)" class="hamburger-garden__empty">
            {{ t.noData }}
          </p>

          <dl v-else class="hamburger-garden__result">
            <div
              v-if="resultFor(slide.id).plants !== null"
              class="hamburger-garden__result-row"
            >
              <dt>{{ slide.id === "seedlings" ? t.modeSeedlings : t.plants }}</dt>
              <dd>{{ resultFor(slide.id).plants }}</dd>
            </div>
            <div
              v-if="slide.id === 'seeds' && resultFor('seeds').seedGrams !== null"
              class="hamburger-garden__result-row"
            >
              <dt>{{ t.seeds }}</dt>
              <dd>~{{ resultFor("seeds").seedGrams }} {{ t.unitGram }}</dd>
            </div>
            <div
              v-if="
                slide.id === 'fertilizer' &&
                resultFor('fertilizer').fertilizerGrams !== null
              "
              class="hamburger-garden__result-row"
            >
              <dt>{{ t.fertilizer }}</dt>
              <dd>~{{ resultFor("fertilizer").fertilizerGrams }} {{ t.unitGram }}</dd>
            </div>
            <div
              v-if="resultFor(slide.id).packs?.length"
              class="hamburger-garden__result-row"
            >
              <dt>{{ t.packs }}</dt>
              <dd>{{ packsLabel(slide.id) }}</dd>
            </div>
            <div
              v-for="row in modeInfoFor(slide.id)"
              :key="row.label"
              class="hamburger-garden__result-row"
            >
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </template>
      </USlider>
    </section>

    <!-- Товары растения -->
    <section v-if="selectedCrop" class="hamburger-garden__section">
      <div class="hamburger-garden__section-head">
        <h3 class="hamburger-garden__question">
          <Icon name="mingcute:basket-line" class="hamburger-garden__question-icon" />
          {{ t.productsTitle }}
        </h3>
        <!-- Правый слот: в панели сюда приходит кнопка корзины; на странице раздела — пусто -->
        <slot name="products-action" />
      </div>

      <div v-if="purposeGroups.length" class="hamburger-garden__groups">
        <UAccordion
          v-for="(group, index) in purposeGroups"
          :key="group.id"
          open
        >
          <template #header>
            <span class="hamburger-garden__group-label">
              <Icon :name="group.icon" class="hamburger-garden__group-icon" />
              <span class="hamburger-garden__group-title">{{ group.label }}</span>
            </span>
            <!-- Пунктирный лидер: растягивается между названием и шевроном -->
            <span class="hamburger-garden__group-leader" aria-hidden="true" />
          </template>

          <!-- Тело группы: обёртка с overflow: hidden нужна для схлопывания -->
          <div class="hamburger-garden__group-body">
            <ul class="hamburger-garden__list">
              <li
                v-for="(prod, itemIndex) in group.items"
                :key="prod.documentId"
                :class="[
                  'hamburger-garden__product-item',
                  {
                    'hamburger-garden__product-item_extra': itemIndex >= GROUP_PREVIEW,
                    'hamburger-garden__product-item_extra_is-open':
                      itemIndex >= GROUP_PREVIEW && expandedGroups.has(index),
                  },
                ]"
                @click.capture="onProductClick(prod, $event)"
              >
                <NuxtLink
                  class="hamburger-garden__product accordion__summary"
                  :to="getProductLink(prod)"
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
                  <Icon
                    v-if="!(prod.mainImage?.url || prod.image?.length)"
                    name="mingcute:shopping-bag-2-line"
                    class="hamburger-garden__product-icon"
                  />
                  <span class="hamburger-garden__product-name">{{ prod.name }}</span>
                </NuxtLink>
                <!-- Кнопка добавления: иконка корзины, поверх неё — крупный плюс
                     с эффектом втиснения. Количество — счётчиком НАД кнопкой справа
                     (абсолютное позиционирование: кнопка не растёт, соседи не сдвигаются) -->
                <UButton
                  variant="plain"
                  :class="[
                    'hamburger-garden__add',
                    { 'hamburger-garden__add_in-cart': cartQtyFor(prod.documentId) > 0 },
                  ]"
                  :aria-label="
                    cartQtyFor(prod.documentId) > 0
                      ? `${buttonT.ariaLabelIncreaseQuantity}: ${prod.name}`
                      : `${buttonT.label}: ${prod.name}`
                  "
                  @click="addProductToCart(prod)"
                >
                  <Icon
                    :name="cartQtyFor(prod.documentId) > 0 ? 'mingcute:add-line' : 'cil:cart'"
                    :width="20"
                    :height="20"
                  />
                  <span
                    v-if="cartQtyFor(prod.documentId) > 0"
                    :key="cartQtyFor(prod.documentId)"
                    class="hamburger-garden__add-count"
                  >{{ cartQtyFor(prod.documentId) }}</span>
                </UButton>
              </li>
            </ul>

            <!-- «Показать все»: только если товаров больше превью -->
            <UButton
              v-if="group.items.length > GROUP_PREVIEW"
              variant="plain"
              :class="[
                'hamburger-garden__show-all',
                { 'hamburger-garden__show-all_is-open': expandedGroups.has(index) },
              ]"
              :aria-label="
                expandedGroups.has(index)
                  ? buttonT.ariaLabelCollapseProducts
                  : buttonT.ariaLabelShowAllProducts
              "
              @click="toggleGroupProducts(index)"
            >
              <Icon name="mingcute:down-line" />
            </UButton>
          </div>
        </UAccordion>
      </div>

      <ULoader v-show="pendingProducts" />

      <p v-if="!pendingProducts && !purposeGroups.length" class="hamburger-garden__empty">
        {{ t.emptyProducts }}
      </p>
    </section>

    <!-- Статьи блога по растению -->
    <section v-if="selectedCrop && articles?.length" class="hamburger-garden__section">
      <h3 class="hamburger-garden__question">
        <Icon name="mdi:book-open-outline" class="hamburger-garden__question-icon" />
        {{ t.articlesTitle }}
      </h3>
      <ul class="hamburger-garden__list">
        <!-- Клик перехватываем на li (фаза перехвата): на телефоне откроется
             модалка, на десктопе ссылка сработает как обычно -->
        <li
          v-for="article in articles"
          :key="article.documentId"
          itemscope
          itemtype="https://schema.org/Article"
          @click.capture="onArticleClick(article, $event)"
        >
          <NuxtLink
            class="hamburger-garden__article"
            :to="`/${currentLocale}/blog/${article.slug}`"
            itemprop="url"
          >
            <Icon name="mingcute:document-line" />
            <span itemprop="headline">{{ article.title }}</span>
          </NuxtLink>
          <time
            v-if="article.date"
            class="visually-hidden"
            itemprop="datePublished"
            :datetime="article.date"
          >{{ article.date }}</time>
        </li>
      </ul>
    </section>

    <!-- Частые вопросы: тот же источник (calculator-page.faq), что и на странице -->
    <section v-if="showFaq && faqItems?.length" class="hamburger-garden__section">
      <h3 class="hamburger-garden__question">
        <Icon name="mingcute:question-line" class="hamburger-garden__question-icon" />
        {{ t.faqTitle }}
      </h3>
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

    <!-- Модальные окна (в конце разметки, чтобы не разрывать соседство секций,
         от которого зависит разделитель между блоками) -->
    <ShowModalArticle
      ref="article-modal"
      :slug="activeArticle?.slug"
      :title="activeArticle?.title"
      :date="activeArticle?.date"
      :show-calculator="false"
    />

    <ShowModalProduct
      ref="product-modal"
      :product="activeProduct"
      hide-trigger
    />
  </div>
</template>

<style lang="scss" scoped>
.hamburger-garden {
  display: flex;
  flex-direction: column;
  row-gap: toEm(16);
  // Ширина строго по слайду панели: без этого карточка считается по
  // содержимому (слайдер расчёта распирал её до ~510px)
  width: 100%;
  min-width: 0;
  min-height: 100%;
  // Светлая подложка: на размытом фоне панели зелёные подписи и текст читались плохо
  padding: toEm(12);
  border-radius: toRem(12);
  background-color: rgba(255, 255, 255, 0.72);

  // Шапка слайда: заголовок + подзаголовок
  &__head {
    display: flex;
    flex-direction: column;
    row-gap: toEm(2);
    // Отдельной линии над «Что сажаем?» нет: верх блока даёт общая рамка группы
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

  // Блоки — каждый в рамке-«канавке» (эталон: рамка langSwitcher): 1px рамка,
  // скругление 4px и светлый блик по внутреннему верхнему краю
  &__section {
    display: flex;
    flex-direction: column;
    row-gap: toEm(8);
    // Сверху на 3px меньше (7 вместо 10)
    padding: toEm(7) toEm(10) toEm(10);
    border: toRem(1) solid rgba(0, 0, 0, 0.25);
    border-radius: toRem(4);
    box-shadow: inset 0 toRem(1) 0 rgba(255, 255, 255, 0.4);
  }

  // Секция расчёта: горизонтальный свайп обрабатываем сами, вертикальный
  // отдаём прокрутке контента (иначе панель листается на «Меню»)
  &__section_calc {
    touch-action: pan-y;
  }

  // «Что сажаем?» + «Калькулятор расчёта» — один визуальный блок: общая рамка,
  // между секциями — пунктирный разделитель (низ и нижние углы замыкает
  // секция расчёта, поэтому у верхней части низа нет)
  &__section:first-of-type {
    border-bottom: none;
    border-radius: toRem(4) toRem(4) 0 0;
    // Низ = верху секции расчёта (15px), иначе блок «Что сажаем?» жмётся к пунктиру
    padding-block-end: toEm(15);
  }

  // Растение не выбрано — секции расчёта нет, рамка «Что сажаем?» замыкается
  &__section:first-of-type:not(:has(+ .hamburger-garden__section_calc)) {
    border-bottom: toRem(1) solid rgba(0, 0, 0, 0.25);
    border-radius: toRem(4);
  }

  // Секция расчёта прижата к верхней части группы (margin гасит row-gap
  // карточки), сверху — пунктирный разделитель шириной 90% по центру
  &__section:first-of-type + &__section_calc {
    position: relative;
    margin-block-start: calc(-1 * toEm(16));
    // Верхнюю границу рисует пунктирный ::before, а не рамка секции
    border-top: none;
    border-radius: 0 0 toRem(4) toRem(4);
    // Отступ до пунктира увеличен на 8px (7 + 8) — блоки не «слипаются»
    padding-block-start: toEm(15);

    &::before {
      content: "";
      position: absolute;
      inset-block-start: 0;
      // Не до самых краёв блока — 90% ширины по центру
      inset-inline: 5%;
      border-block-start: toRem(1) dashed rgba(0, 0, 0, 0.25);
    }
  }

  &__question {
    display: flex;
    align-items: center;
    column-gap: toEm(6);
    font-size: toEm(18);
    font-weight: 600;
    color: var(--primary-color);
  }

  // Строка заголовка блока: заголовок слева, действие справа (в панели — кнопка
  // корзины). Правое выравнивание — на одну вертикаль с шевронами групп
  &__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: toEm(10);
  }

  // Иконка перед заголовком раздела. overflow: visible + display: block —
  // иначе svg режет артворк по краям (было заметно сверху)
  &__question-icon {
    flex-shrink: 0;
    display: block;
    overflow: visible;
    font-size: toRem(20);
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
  // Площадь: подпись с иконкой слева, единицы измерения справа
  &__units-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: toEm(10);
  }

  &__units {
    display: flex;
    justify-content: flex-end;
    column-gap: toEm(6);
  }

  &__unit {
    padding: toEm(4) toEm(10);
    // Тонкая рамка — чтобы неактивный таб читался как кнопка на размытом фоне.
    // Рамку даём обеим кнопкам, чтобы размеры совпадали
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(8);
    background-color: var(--light-color-transparent);
    color: var(--gray-color);
    // +2px к прежнему размеру: было toEm(13) ≈ 11.45px → стало 13.45px
    // (делитель — фактический шрифт родителя: 14.1px). Верхний регистр снят:
    // «М²» и «Сотки» заданы значениями в локалях (текст как в макете, не через CSS)
    font-size: toEm(13.45, 14.1);
    font-weight: 600;
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration),
      background-color var(--transition-duration);

    &_is-active {
      border-color: var(--green-color);
      color: var(--light-color);
      background-color: var(--green-color);
    }

    @include hover {
      color: var(--primary-color);
    }
  }

  // Поле площади: справа (подпись — в строке с единицами выше)
  &__field {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    column-gap: toEm(8);
  }

  &__field-label {
    display: inline-flex;
    align-items: center;
    column-gap: toEm(6);
    font-weight: 600;
    color: var(--color);
  }

  // Иконка перед подписью «Площадь»
  &__label-icon {
    flex-shrink: 0;
    font-size: toRem(18);
    color: var(--primary-color);
  }

  &__input {
    // На 20% уже прежней ширины (было 120px) — значения всё равно короткие
    flex: 0 1 toRem(96);
    min-width: 0;

    // Компактнее базового поля, число — по правому краю
    :deep(.u-input__field) {
      padding-block: toEm(7);
      font-size: toEm(16);
      text-align: right;
    }
  }

  &__field-unit {
    color: var(--gray-color);
  }

  // Слайдер расчёта: слайды по режимам — тот же паттерн, что у слайдера панели
  // (USlider, вариант background). Внизу — только точки, без подложки
  // Слайдер расчёта: слайды по режимам (USlider, вариант background).
  // Внизу — только точки, без подложки
  &__calc-slider {
    // Отключение нативного скролла, snap и column-gap даёт USlider в режиме
    // nested — здесь только оформление пагинации

    // Пагинация: точки в правом углу (остальное — из базы USlider)
    :deep(.slider__pagination) {
      justify-content: flex-end;
      column-gap: toRem(8);
    }

    // Точки видимы на светлой карточке: неактивные серые, активная — зелёная
    :deep(.slider__pagination-dot) {
      width: toRem(7);
      height: toRem(7);
      border: none;
      outline: none;
      background-color: var(--gray-color);
      opacity: 0.35;
      transition:
        opacity var(--transition-duration),
        background-color var(--transition-duration);
    }

    :deep(.slider__pagination-dot_active) {
      opacity: 1;
      background-color: var(--primary-color);
    }
  }

  // Результат
  // Таблица результата: grid, колонка значений — по самому широкому значению
  // (max-content) → вертикальные линии во всех строках в одной плоскости;
  // значение идёт сразу за линией (небольшой отступ)
  &__result {
    display: grid;
    grid-template-columns: 1fr max-content;
    padding: toEm(4) toEm(12);
    border-radius: toRem(8);
    background-color: var(--light-color-transparent);
  }

  // Обёртка строки растворяется: dt/dd становятся ячейками grid
  &__result-row {
    display: contents;
  }

  &__result-row dt,
  &__result-row dd {
    display: flex;
    align-items: center;
    padding-block: toEm(6);
    // Горизонтальная «канавка» между строками — эталон: разделитель секций
    // в диалоге фильтров (тёмная линия + внутренняя тень + светлый блик)
    border-bottom: toRem(1) solid rgba(0, 0, 0, 0.3);
    box-shadow:
      inset 0 toRem(-1) 0 rgba(0, 0, 0, 0.08),
      0 toRem(1) 0 rgba(255, 255, 255, 0.6);
  }

  &__result-row dt {
    color: var(--gray-color);
  }

  &__result-row dd {
    // Значения — по правому краю
    justify-content: flex-end;
    // Небольшой отступ между вертикальной линией и колонкой значений
    padding-inline-start: toEm(8);
    // Вертикальная «канавка»: одна плоскость во всех строках
    border-inline-start: toRem(1) solid rgba(0, 0, 0, 0.3);
    box-shadow:
      inset 0 toRem(-1) 0 rgba(0, 0, 0, 0.08),
      0 toRem(1) 0 rgba(255, 255, 255, 0.6),
      inset toRem(1) 0 0 rgba(0, 0, 0, 0.08),
      toRem(1) 0 0 rgba(255, 255, 255, 0.6);
    font-weight: 700;
    color: var(--primary-color);
  }

  // Последняя строка — без горизонтальной канавки
  &__result-row:last-child dt {
    border-bottom: none;
    box-shadow: none;
  }

  &__result-row:last-child dd {
    border-bottom: none;
    box-shadow:
      inset toRem(1) 0 0 rgba(0, 0, 0, 0.08),
      toRem(1) 0 0 rgba(255, 255, 255, 0.6);
  }

  // Товары: группы — аккордеоны проекта (UAccordion). Промежуток даёт сам
  // аккордеон (padding-block у .accordion__details), поэтому контейнер без
  // flex-gap: иначе details и его content получили бы лишний зазор
  &__groups {
    display: block;

    // Нейтрализуем глобальные стили summary аккордеона (фон/паддинги/оутлайн) —
    // сохраняем текущий вид группы. Цвет при раскрытии не меняем на danger
    :deep(.accordion__summary) {
      padding: 0;
      background: none;
      outline: none;
    }

    :deep(.accordion__details[open] > .accordion__summary) {
      color: var(--gray-color);
    }

    :deep(.accordion__details) {
      padding-block: toRem(3);
    }
  }

  // Подпись группы: иконка + название (шрифт summary — 22px, делитель явный)
  &__group-label {
    display: flex;
    align-items: center;
    column-gap: toEm(6, 22);
  }

  &__group-title {
    font-size: toEm(15, 22);
    font-weight: 600;
    color: var(--gray-color);
  }

  // Пунктирный лидер: тянется между названием и штатным шевроном аккордеона,
  // по вертикальному центру строки (высота 0 + граница = линия по центру)
  &__group-leader {
    flex: 1;
    height: 0;
    align-self: center;
    margin-inline: toEm(8, 22);
    border-bottom: toRem(1) dashed var(--border-color);
  }

  // Иконка перед названием группы (семена / рассада / удобрения)
  &__group-icon {
    flex-shrink: 0;
    font-size: toRem(18);
    color: var(--gray-color);
  }

  // Тело группы — обязательный overflow: hidden для схлопывания аккордеона
  &__group-body {
    overflow: hidden;
    // Тот же отступ «подзаголовок → товары», что был до перевода в аккордеон
    padding-block-start: toRem(1.3);
  }

  // «Показать все»: по центру под списком, шеврон переворачивается при раскрытии.
  // Цвет — как у названий товаров (та же переменная); сам шеврон наследует цвет
  // кнопки через currentColor, вторую переменную не заводим
  &__show-all {
    display: flex;
    align-items: center;
    justify-content: center;
    // Круглая кнопка вокруг шеврона: закругление 50%, размер по иконке.
    // Без рамки и блика — только светлый фон
    width: toRem(32);
    height: toRem(32);
    margin-inline: auto;   // по центру под списком
    padding: 0;
    min-height: 0;         // сброс паддингов/min-height UButton, иначе не круг
    border: none;
    border-radius: 50%;
    background-color: var(--light-color-transparent);
    // Единственный источник цвета — кнопка (как у названий товаров)
    color: var(--warning-color);

    :deep(svg) {
      // Шеврон наследует цвет кнопки через currentColor — второй переменной нет
      color: currentColor;
      font-size: toRem(20);
      transition: rotate var(--transition-duration);
    }

    &_is-open :deep(svg) {
      rotate: -180deg;
    }

    @include hover {
      color: var(--warning-hover);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    row-gap: toEm(4);
  }

  // Товар: подложка (ссылка) — по ширине контента, кнопка — у правого края.
  // Grid (а не flex) — потому что доп. товары схлопываются через
  // grid-template-rows 0fr → 1fr, как разделы аккордеона
  &__product-item {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: toEm(8);
    padding-block: toEm(6);
    padding-inline-end: toEm(8);

    // Ссылка — по своему контенту (как было во flex), иначе её внутренний
    // space-between разнёс бы картинку и название по краям колонки
    .hamburger-garden__product {
      justify-self: start;
    }
  }

  // Доп. товары (за превью): в свёрнутом виде занимают ноль и раскрываются
  // с той же длительностью, что и содержимое аккордеона (0.3s).
  // Механизм — max-height (grid-template-rows не схлопывался: содержимое с
  // фиксированными высотами — картинка 32px, кнопка 36px — не давало строке сжаться)
  &__product-item_extra {
    max-height: 0;
    padding-block: 0;
    margin-block-start: calc(-1 * #{toEm(4)});
    overflow: hidden;
    transition:
      max-height 0.3s,
      padding-block-start 0.3s,
      padding-block-end 0.3s,
      margin-block-start 0.3s;

    &_is-open {
      max-height: toRem(120);   // с запасом на длинное название в одну-две строки
      padding-block: toEm(6);
      margin-block-start: 0;
    }
  }

  // Кнопка добавления: иконка корзины, а когда товар уже в корзине — плюс
  // (плюс подсказывает, что повторное нажатие добавит ещё)
  &__add {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: toRem(36);
    height: toRem(36);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(10);
    background-color: var(--light-color);
    color: var(--success-color);
    // Иконка корзины меньше — над ней помещается плюс (без наложения)
    font-size: toRem(16);
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration);

    // Товар уже в корзине — заметная рамка
    &_in-cart {
      border-color: var(--success-color);
    }

    @include hover {
      color: var(--warning-hover);
    }
  }

  // Счётчик — как у кнопки корзины: в правом верхнем углу, вплотную к иконке
  &__add-count {
    position: absolute;
    top: toRem(-4);
    right: toRem(-4);
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
    // Ключ меняется вместе с количеством — анимация проигрывается заново
    animation: gardenCountPop 0.25s ease;
  }

  // Ссылка на товар: оутлайн — только у «details» (аккордеон), здесь не нужен.
  // Фон аккордеона (--light-color-transparent) тоже убираем: у товара только текст
  &__product {
    outline: none;
    background-color: transparent;
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

    // Подсказка, что по товару можно кликнуть (на телефоне откроется окно товара):
    // при наведении подчёркивание становится ярче, а текст — цвета warning-hover
    @include hover {
      .hamburger-garden__product-name {
        color: var(--warning-hover);
        text-decoration-color: currentColor;
      }
    }
  }

  // Иконка товара (фолбэк, когда у товара нет изображения из CMS)
  &__product-icon {
    flex-shrink: 0;
    font-size: toRem(18);
    color: var(--warning-hover);
  }

  &__product-name {
    text-align: left;
    // Ещё на 2px меньше (было 20px → 18px)
    font-size: toEm(18, 22);
    // Цвет товара — warning (акцент), на ховере — warning-hover
    color: var(--warning-color);
    // Постоянное, но неброское подчёркивание — признак кликабельности
    text-decoration: underline;
    text-decoration-color: rgba(0, 0, 0, 0.25);
    text-underline-offset: toRem(3);
    transition:
      color var(--transition-duration),
      text-decoration-color var(--transition-duration);
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

// Короткая подсветка счётчика при добавлении: видно, что количество выросло
@keyframes gardenCountPop {
  0% {
    scale: 1;
  }

  50% {
    scale: 1.3;
  }

  100% {
    scale: 1;
  }
}
</style>
