<script setup lang="ts">
import { gardenTranslations } from "~/locales/garden";
import { calcPlanting } from "~~/shared/utils/calc";

// Слайд «Посадка» панели каталога: «Что сажаем?» → расчёт (площадь → растения →
// семена/удобрение) и товары для выбранного растения.
const emit = defineEmits<{
  navigate: [];
}>();

const { currentLocale } = useLocale();
const { getProductLink } = useProductLink();

const t = computed(() => gardenTranslations[currentLocale.value]);

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
interface GardenCrop {
  documentId: string;
  name: string;
  slug?: string;
  planting?: GardenPlanting | null;
}

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
      populate: { planting: true },
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
    if (!selectedId.value && list?.length) selectedId.value = list[0].documentId;
  },
  { immediate: true },
);

// ===== Калькулятор =====
const area = ref(1);
const result = computed(() =>
  calcPlanting({
    areaSqm: area.value,
    planting: selectedCrop.value?.planting ?? null,
  }),
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
    const response = await find<Product>("products", {
      filters: {
        locale: { $eq: currentLocale.value },
        crop: { documentId: { $eq: selectedId.value } },
      },
      pagination: { pageSize: 100 } as PaginationMeta,
      populate: {
        mainImage: { fields: ["alternativeText", "url"] },
        image: { fields: ["alternativeText", "url"] },
      },
    } as any);
    return response.data || [];
  },
  { watch: [productsKey], server: false, ttl: 300_000 },
);

type Purpose = "seeds" | "seedlings" | "fertilizer" | "other";
const purposeGroups = computed(() => {
  const groups: Record<Purpose, Product[]> = {
    seeds: [],
    seedlings: [],
    fertilizer: [],
    other: [],
  };
  for (const p of products.value ?? []) {
    const purpose = (p.purpose as Purpose) || "other";
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
          {{ crop.name }}
        </button>
      </div>
      <p v-else-if="!pendingCrops" class="hamburger-garden__empty">
        {{ t.emptyCrops }}
      </p>
    </section>

    <!-- Калькулятор -->
    <section v-if="selectedCrop" class="hamburger-garden__section">
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

      <dl class="hamburger-garden__result">
        <div v-if="result.plants !== null" class="hamburger-garden__result-row">
          <dt>{{ t.plants }}</dt>
          <dd>{{ result.plants }}</dd>
        </div>
        <div v-if="result.seedGrams !== null" class="hamburger-garden__result-row">
          <dt>{{ t.seeds }}</dt>
          <dd>~{{ result.seedGrams }} {{ t.unitGram }}</dd>
        </div>
        <div v-if="result.fertilizerGrams !== null" class="hamburger-garden__result-row">
          <dt>{{ t.fertilizer }}</dt>
          <dd>~{{ result.fertilizerGrams }} {{ t.unitGram }}</dd>
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
            <li v-for="prod in group.items" :key="prod.documentId">
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
