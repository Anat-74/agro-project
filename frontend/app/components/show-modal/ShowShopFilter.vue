<script setup lang="ts">
import { shopFiltersTranslations } from '~/locales/shopFilters'

const { find } = useStrapi();
const { currentLocale } = useLocale();
const t = computed(() => shopFiltersTranslations[currentLocale.value])

interface Props {
  category?: string
  sort?: string
  priceMin?: number
  priceMax?: number
  tags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  category: "",
  sort: "name:asc",
  priceMin: 0,
  priceMax: 2000,
  tags: () => [],
})

const emit = defineEmits<{
  "update:category": [v: string]
  "update:sort": [v: string]
  "update:priceMin": [v: number]
  "update:priceMax": [v: number]
  "update:tags": [v: string[]]
}>()

// Диалог сайдбара фильтров: show() (не модальный), как ShowHamburger
const dialogElement = useTemplateRef<HTMLDialogElement>("dialog-shop-filter");
const { open, close, isOpen } = useDialog("shopFilterDialog", dialogElement, {
  useShowMethod: true,
});

// const { width } = useViewport()
// const isTablet = computed(() => width.value <= 1024)

// Изначально открыт при переходе на страницу.
// Диалог внутри ClientOnly/Teleport — элемент появляется после монтирования,
// поэтому ждём ref (onMounted срабатывает раньше, show() не вызовется).
watch(dialogElement, (el) => {
  if (el) open?.()
})

// Управление диалогом из страницы (кнопка «Фильтр» в top-bar)
const toggle = () => {
  if (isOpen.value) close?.()
  else open?.()
}
defineExpose({ open, close, isOpen, toggle })

// ===== Категории (с количеством товаров) =====
const { data: categoriesData } = useCachedAsyncData(
  `shop-categories-${currentLocale.value}`,
  () => find("categories", {
    filters: { locale: { $eq: currentLocale.value } },
    fields: ["id", "name", "slug"],
    populate: { products: { fields: ["id"] } },
  } as any),
  { ttl: 600_000 },
)

const categories = computed(() => (categoriesData.value?.data as Category[] | undefined) ?? [])
const categoryCount = (cat: Category) => cat.products?.length ?? 0

// ===== Товары со скидкой (для списка «Sale Products») =====
const { data: saleData } = useCachedAsyncData(
  `shop-sale-${currentLocale.value}`,
  () => find("products", {
    filters: { isDiscount: { $eq: true }, locale: { $eq: currentLocale.value } },
    fields: ["name", "price"],
    sort: ["price:asc"],
    pagination: { page: 1, pageSize: 5 },
  } as any),
  { ttl: 600_000 },
)

const saleProducts = computed(() => (saleData.value?.data as Product[] | undefined) ?? [])

// ===== Сортировка =====
const sortOption = computed({
  get: () => props.sort,
  set: (v) => emit("update:sort", v),
})

// ===== Диапазон цены (два ползунка) =====
const PRICE_MAX = 2000
const localMin = ref(props.priceMin)
const localMax = ref(props.priceMax)

const minPct = computed(() => (localMin.value / PRICE_MAX) * 100)
const maxPct = computed(() => 100 - (localMax.value / PRICE_MAX) * 100)

const onMinInput = () => {
  if (localMin.value > localMax.value) localMin.value = localMax.value
  emit("update:priceMin", localMin.value)
}

const onMaxInput = () => {
  if (localMax.value < localMin.value) localMax.value = localMin.value
  emit("update:priceMax", localMax.value)
}

// ===== Теги (чекбоксы-пилюли) =====
const toggleTag = (tag: string) => {
  const next = props.tags.includes(tag)
    ? props.tags.filter((item) => item !== tag)
    : [...props.tags, tag]
  emit("update:tags", next)
}
</script>

<template>
  <div class="show-shop-filter">
    <ClientOnly>
        <dialog id="dialogShopFilter" ref="dialog-shop-filter" class="show-shop-filter__dialog">
          <aside class="shop-filters">
            <div class="shop-filters__header">
              <h2 class="shop-filters__title">{{ t.filterTitle }}</h2>
              <div class="shop-filters__sort">
                <label class="visually-hidden" for="shop-filters-sort">
                  {{ t.sortLabel }}
                </label>
                <select
                  id="shop-filters-sort"
                  v-model="sortOption"
                  class="shop-filters__select select"
                >
                  <option value="name:asc">{{ t.sortName }}</option>
                  <option value="price:asc">{{ t.sortPriceAsc }}</option>
                  <option value="price:desc">{{ t.sortPriceDesc }}</option>
                </select>
              </div>
            </div>

            <!-- Категории: без заголовка — название блока дублирует текст радио-кнопок -->
            <section class="shop-filters__section" aria-label="Categories">
              <ul class="shop-filters__category-list">
                <li v-for="cat in categories" :key="cat.slug" class="shop-filters__category">
                  <UInput
                    class="shop-filters__category-input"
                    type="radio"
                    name="shop-category"
                    :value="cat.slug"
                    :model-value="category"
                    :label="cat.name"
                    @update:model-value="emit('update:category', $event)"
                  />
                  <span class="shop-filters__category-count">({{ categoryCount(cat) }})</span>
                </li>
              </ul>
            </section>

            <!-- Цена -->
            <section class="shop-filters__section">
              <h3 class="shop-filters__section-title">{{ t.priceTitle }}</h3>
              <div class="shop-filters__price">
                <div class="shop-filters__price-track">
                  <div
                    class="shop-filters__price-fill"
                    :style="{ left: `${minPct}%`, right: `${maxPct}%` }"
                  />
                  <input
                    v-model.number="localMin"
                    type="range"
                    :min="0"
                    :max="PRICE_MAX"
                    class="shop-filters__price-input shop-filters__price-input_min"
                    @input="onMinInput"
                  >
                  <input
                    v-model.number="localMax"
                    type="range"
                    :min="0"
                    :max="PRICE_MAX"
                    class="shop-filters__price-input shop-filters__price-input_max"
                    @input="onMaxInput"
                  >
                </div>
                <div class="shop-filters__price-values">
                  <span class="shop-filters__price-value">{{ formatPrice(localMin) }}</span>
                  <span class="shop-filters__price-separator">—</span>
                  <span class="shop-filters__price-value">{{ formatPrice(localMax) }}</span>
                </div>
              </div>
            </section>

            <!-- Популярные теги -->
            <section class="shop-filters__section">
              <h3 class="shop-filters__section-title">{{ t.tagsTitle }}</h3>
              <ul class="shop-filters__tags">
                <li v-for="tag in t.tags" :key="tag" class="shop-filters__tag-item">
                  <label class="shop-filters__tag">
                    <input
                      type="checkbox"
                      :checked="tags.includes(tag)"
                      class="shop-filters__tag-input"
                      @change="toggleTag(tag)"
                    >
                    <span class="shop-filters__tag-text">{{ tag }}</span>
                  </label>
                </li>
              </ul>
            </section>

            <!-- Баннер «Скидка 79%» (изображение Bannar.jpg) -->
            <div class="shop-filters__banner">
              <div class="shop-filters__banner-content">
                <span class="shop-filters__banner-badge">{{ t.discountBadge }}</span>
                <p class="shop-filters__banner-text">{{ t.discountText }}</p>
                <span class="shop-filters__banner-link">
                  {{ t.discountLink }}
                  <Icon name="mdi:arrow-right" />
                </span>
              </div>
            </div>

            <!-- Товары со скидкой -->
            <section v-if="saleProducts.length" class="shop-filters__section">
              <h3 class="shop-filters__section-title">{{ t.saleTitle }}</h3>
              <ul class="shop-filters__sale-list">
                <li
                  v-for="prod in saleProducts"
                  :key="prod.documentId"
                  class="shop-filters__sale-item"
                >
                  <span class="shop-filters__sale-name">{{ prod.name }}</span>
                  <span class="shop-filters__sale-price">{{ formatPrice(prod.price) }}</span>
                </li>
              </ul>
            </section>

            <!-- Рассылка -->
            <div class="shop-filters__newsletter">
              <h4 class="shop-filters__newsletter-title">{{ t.newsletterTitle }}</h4>
              <p class="shop-filters__newsletter-text">{{ t.newsletterText }}</p>
            </div>
          </aside>
        </dialog>
    </ClientOnly>
  </div>
</template>

<style lang="scss" scoped>
.show-shop-filter {
  // ===== Диалог сайдбара =====
  &__dialog {
    border: none;
    padding: 0;
    margin: 0;
    background: transparent;
    width: fit-content;
    max-width: none;

    &[open] {
      display: block;
    }
  }

  // На планшете/мобильном диалог телепортируется в body — фиксированное окно слева
  @media (max-width: $tablet) {
    &__dialog {
      position: fixed;
      inset-block-start: toRem(70);
      inset-inline-start: toRem(16);
      z-index: 100;
      max-height: calc(100vh - toRem(90));
      overflow-y: auto;
    }
  }

  @media (max-width: $mobile) {
    &__dialog {
      inset-inline: 0;
      inset-inline-start: 0;
      width: 100%;
      max-width: none;
      padding-inline: toRem(16);
      box-sizing: border-box;
    }
  }
}

// ===== Содержимое сайдбара фильтров =====
.shop-filters {
  width: toRem(280);
  flex-shrink: 0;
  padding-inline-end: toRem(30);
  color: var(--color);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-block-end: toRem(18);
    border-bottom: toRem(1) solid var(--border-color);
    margin-block-end: toRem(24);
  }

  &__title {
    margin: 0;
    font-weight: 600;
    @include adaptiveValue("font-size", 20, 18);
  }

  &__sort {
    display: flex;
    align-items: center;
  }

  &__select {
    width: auto;
  }

  &__section {
    margin-block-end: toRem(24);
    padding-block-end: toRem(24);
    border-bottom: toRem(1) solid var(--border-color);

    &:last-child {
      border-bottom: none;
      margin-block-end: 0;
      padding-block-end: 0;
    }
  }

  &__section-title {
    margin: 0 0 toRem(16) 0;
    font-weight: 600;
    @include adaptiveValue("font-size", 18, 16);
  }

  // ==== Категории (radio) ====
  &__category-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: toRem(10);
  }

  &__category {
    display: flex;
    align-items: center;
    gap: toRem(8);

    // UInput radio внутри строки: имя занимает свободное место, счётчик справа
    :deep(.u-input) {
      flex: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    :deep(.u-input__radio-label) {
      flex: 1;
      font-size: toEm(15);
    }
  }

  &__category-count {
    font-size: toEm(13);
    color: var(--gray-color);
  }

  // ==== Цена (двойной ползунок) ====
  &__price-track {
    position: relative;
    height: toRem(4);
    background: var(--border-color);
    border-radius: toRem(2);
    margin-block-end: toRem(16);
  }

  &__price-fill {
    position: absolute;
    height: 100%;
    background: var(--success-color);
    border-radius: toRem(2);
    pointer-events: none;
  }

  &__price-input {
    position: absolute;
    top: 50%;
    width: 100%;
    height: toRem(4);
    appearance: none;
    background: transparent;
    pointer-events: none;
    transform: translateY(-50%);

    &_min {
      z-index: 2;
    }

    &_max {
      z-index: 1;
    }

    &::-webkit-slider-thumb {
      appearance: none;
      width: toRem(16);
      height: toRem(16);
      background: var(--light-color);
      border: toRem(2) solid var(--success-color);
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 toRem(2) toRem(6) rgba(0, 0, 0, 0.15);
      transition: transform var(--transition-duration);

      @include hover {
        transform: scale(1.15);
      }
    }

    &::-moz-range-thumb {
      width: toRem(16);
      height: toRem(16);
      background: var(--light-color);
      border: toRem(2) solid var(--success-color);
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 toRem(2) toRem(6) rgba(0, 0, 0, 0.15);
    }
  }

  &__price-values {
    display: flex;
    align-items: center;
    gap: toRem(8);
    font-size: toEm(15);
    color: var(--color);
  }

  &__price-separator {
    color: var(--border-color);
  }

  // ==== Популярные теги (чекбоксы-пилюли) ====
  &__tags {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: toRem(8);
  }

  &__tag-item {
    margin: 0;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    padding: toRem(6) toRem(16);
    background: var(--whitesmoke-color);
    border-radius: toRem(20);
    border: toRem(1) solid transparent;
    transition: all var(--transition-duration);

    @include hover {
      background: var(--bg-product);
      border-color: var(--success-color);
    }

    // Выбранный тег: заливка акцентным цветом (input скрыт)
    &:has(.shop-filters__tag-input:checked) {
      background: var(--success-color);
      border-color: var(--success-color);

      .shop-filters__tag-text {
        color: var(--light-color);
      }
    }
  }

  &__tag-input {
    display: none;
  }

  &__tag-text {
    font-size: toEm(13);
    color: var(--gray-color);
    transition: color var(--transition-duration);
    user-select: none;
  }

  // ==== Баннер «Скидка 79%» ====
  &__banner {
    border-radius: toRem(12);
    padding: toRem(24) toRem(20);
    margin-block-end: toRem(24);
    min-height: toRem(140);
    background-image: url("/image/Bannar.jpg");
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
  }

  &__banner-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    background: color-mix(in srgb, var(--light-color) 65%, transparent);
    border-radius: toRem(8);
    padding: toRem(10) toRem(12);
  }

  &__banner-badge {
    font-weight: 700;
    color: var(--success-color);
    margin-block-end: toRem(4);
    @include adaptiveValue("font-size", 22, 18);
  }

  &__banner-text {
    margin: 0 0 toRem(14) 0;
    font-size: toEm(15);
    color: var(--color);
  }

  &__banner-link {
    display: inline-flex;
    align-items: center;
    gap: toRem(6);
    font-weight: 600;
    font-size: toEm(14);
    color: var(--color);
    transition: color var(--transition-duration);

    @include hover {
      color: var(--success-color);
    }
  }

  // ==== Товары со скидкой ====
  &__sale-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: toRem(12);
  }

  &__sale-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: toEm(14);
    color: var(--color);
    padding-block: toRem(4);
    cursor: pointer;
    transition: color var(--transition-duration);

    @include hover {
      color: var(--success-color);
    }
  }

  &__sale-name {
    font-weight: 400;
  }

  &__sale-price {
    color: var(--success-color);
    font-weight: 600;
  }

  // ==== Рассылка ====
  &__newsletter {
    margin-block-start: toRem(12);
    padding-block-start: toRem(20);
    border-top: toRem(1) solid var(--border-color);
  }

  &__newsletter-title {
    margin: 0 0 toRem(8) 0;
    font-weight: 600;
    @include adaptiveValue("font-size", 16, 15);
  }

  &__newsletter-text {
    margin: 0;
    font-size: toEm(13);
    color: var(--gray-color);
    line-height: 1.6;
  }

  // ==== Адаптив ====
  @media (max-width: $tablet) {
    width: toRem(240);
    padding-inline-end: toRem(20);
  }

  @media (max-width: $mobile) {
    width: 100%;
    padding-inline-end: 0;
    padding-block-end: toRem(30);

    &__header {
      flex-wrap: wrap;
      gap: toRem(8);
    }

    &__tags {
      gap: toRem(6);
    }

    &__tag {
      padding: toRem(4) toRem(12);

      &-text {
        font-size: toEm(12);
      }
    }

    &__banner {
      min-height: toRem(100);
      padding: toRem(18) toRem(16);
    }
  }
}
</style>
