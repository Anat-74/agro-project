<script setup lang="ts">
import { gardenTranslations } from "~/locales/garden";
import { buttonTranslations } from "~/locales/button";
import { calcPacks, calcPlantsOf, calcPlanting } from "~~/shared/utils/calc";

// Слайд «Посадка» панели каталога: «Что сажаем?» → расчёт (площадь → растения →
// семена/рассада/удобрение) и товары для выбранного растения.
const emit = defineEmits<{
  navigate: [];
}>();

const { currentLocale } = useLocale();
const { getProductLink } = useProductLink();
const cartStore = useCartStore();
const { isInCart } = useIsInCart();

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

// ===== Товары растения (по purpose) =====
const productsKey = computed(
  () => `garden-products-${currentLocale.value}-${selectedId.value ?? "none"}`,
);
const { data: products } = useCachedAsyncData(
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

// «В корзину» из расчёта: добавляем сразу N пачек этого товара
const addProductToCart = (product: GardenProduct) => {
  cartStore.addToCart(
    product,
    product.category?.slug ?? "",
    product.subcategory?.slug ?? null,
    packCountFor(product),
  );
};

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
      <div v-if="crops?.length" class="hamburger-garden__chips">
        <button
          v-for="crop in crops"
          :key="crop.documentId"
          type="button"
          class="hamburger-garden__chip"
          :class="{ 'hamburger-garden__chip_is-active': crop.documentId === selectedId }"
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
        </button>
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
        <button
          v-for="tab in modeTabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="hamburger-garden__mode"
          :class="{ 'hamburger-garden__mode_is-active': mode === tab.id }"
          :aria-selected="mode === tab.id"
          @click="mode = tab.id"
        >
          {{ tab.label }}
        </button>
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
              <button
                type="button"
                class="hamburger-garden__add"
                :class="{ 'hamburger-garden__add_in-cart': isInCart(prod.documentId) }"
                :aria-label="`${buttonT.label}: ${prod.name}`"
                @click="addProductToCart(prod)"
              >
                <Icon name="cil:cart" />
                <span
                  v-if="packCountFor(prod) > 1"
                  class="hamburger-garden__add-count"
                >×{{ packCountFor(prod) }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <p v-else class="hamburger-garden__empty">{{ t.emptyProducts }}</p>
    </section>

    <!-- Ссылка на хаб-страницу раздела (SEO-страница) -->
    <NuxtLink
      class="hamburger-garden__more"
      :to="`/${currentLocale}/posadka-i-urozhay`"
      @click="emit('navigate')"
    >
      {{ t.openSection }}
      <Icon name="mingcute:right-line" />
    </NuxtLink>
  </div>
</template>

<style lang="scss" scoped>
.hamburger-garden {
  display: flex;
  flex-direction: column;
  row-gap: toEm(16);
  min-height: 100%;

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
    cursor: pointer;
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
      object-fit: cover;
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
    padding: toEm(6) toEm(8);
    border: none;
    border-radius: toRem(8);
    background-color: transparent;
    color: var(--gray-color);
    font-size: toEm(14);
    font-weight: 600;
    cursor: pointer;
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

  // Товар + кнопка «В корзину» из расчёта
  &__product-item {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: toEm(6);
  }

  &__add {
    display: inline-flex;
    align-items: center;
    column-gap: toEm(2);
    padding: toEm(4) toEm(6);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(8);
    background-color: var(--light-color);
    color: var(--primary-color);
    font-size: toEm(13);
    font-weight: 600;
    cursor: pointer;
    transition:
      color var(--transition-duration),
      border-color var(--transition-duration);

    &_in-cart {
      border-color: var(--green-color);
      color: var(--green-color);
    }

    @include hover {
      border-color: var(--green-color);
      color: var(--green-color);
    }
  }

  &__add-count {
    line-height: 1;
  }

  &__product {
    justify-content: flex-start;
    column-gap: toEm(8);
    text-decoration: none;
  }

  &__product-name {
    text-align: left;
  }

  &__empty {
    color: var(--gray-color);
    font-style: italic;
    @include adaptiveValue("font-size", 14, 12);
  }

  // Ссылка на хаб-раздел
  &__more {
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: toEm(6);
    margin-block-start: auto;
    padding: toEm(10) toEm(14);
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
}
</style>
