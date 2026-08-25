<script setup lang="ts">
import { shopFiltersTranslations } from '~/locales/shopFilters'

const { find } = useStrapi();
const { currentLocale } = useLocale();
const t = computed(() => shopFiltersTranslations[currentLocale.value])

interface Props {
  category?: string
  priceMin?: number
  priceMax?: number
  tags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  category: "",
  priceMin: 0,
  priceMax: 2000,
  tags: () => [],
})

const emit = defineEmits<{
  "update:category": [v: string]
  "update:priceMin": [v: number]
  "update:priceMax": [v: number]
  "update:tags": [v: string[]]
}>()

// Диалог сайдбара фильтров: show() (не модальный), как ShowHamburger
const dialogElement = useTemplateRef<HTMLDialogElement>("dialog-shop-filter");
const { open, close, isOpen } = useDialog("shopFilterDialog", dialogElement, {
  useShowMethod: true,
});

// Изначально открыт при переходе на страницу (show() — клиентский API)
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
    fields: ["name", "price", "slug"],
    populate: {
      mainImage: { fields: ["alternativeText", "url"] },
      image: { fields: ["alternativeText", "url"] },
    },
    sort: ["price:asc"],
    pagination: { page: 1, pageSize: 5 },
  } as any),
  { ttl: 600_000 },
)

const saleProducts = computed(() => (saleData.value?.data as Product[] | undefined) ?? [])

// ===== Диапазон цены (двойной ползунок — UInput range-dual) =====
const PRICE_MAX = 2000
const localMin = ref(props.priceMin)
const localMax = ref(props.priceMax)

const onRangeChange = (range: [number, number]) => {
  localMin.value = range[0]
  localMax.value = range[1]
  emit("update:priceMin", range[0])
  emit("update:priceMax", range[1])
}

</script>

<template>
  <div class="show-shop-filter">
    <dialog id="dialogShopFilter" ref="dialog-shop-filter" class="show-shop-filter__dialog">
      <aside class="shop-filters">
            <!-- Категории: скрытый заголовок (у section обязан быть) -->
            <section
              class="shop-filters__section"
              aria-labelledby="shop-filters-categories-title"
            >
              <h2 id="shop-filters-categories-title" class="visually-hidden">
                {{ t.categoriesTitle }}
              </h2>
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

            <!-- Цена (двойной ползунок — UInput range-dual) -->
            <section
              class="shop-filters__section"
              aria-labelledby="shop-filters-price-title"
            >
              <h2 id="shop-filters-price-title" class="visually-hidden">
                {{ t.priceTitle }}
              </h2>
              <div class="shop-filters__price">
                  <div class="shop-filters__price-values">
                  <span class="shop-filters__price-value">{{ formatPrice(localMin) }}</span>
                  <span class="shop-filters__price-separator">—</span>
                  <span class="shop-filters__price-value">{{ formatPrice(localMax) }}</span>
                </div>
                <UInput
                  type="range-dual"
                  :min="0"
                  :max="PRICE_MAX"
                  :model-value="[localMin, localMax]"
                  @update:model-value="onRangeChange"
                />
              </div>
            </section>

            <!-- Популярные теги (UInput checkbox-пилюли, модель — массив) -->
            <section
              class="shop-filters__section"
              aria-labelledby="shop-filters-tags-title"
            >
              <h2 id="shop-filters-tags-title" class="visually-hidden">
                {{ t.tagsTitle }}
              </h2>
              <ul class="shop-filters__tags">
                <li v-for="tag in t.tags" :key="tag" class="shop-filters__tag-item">
                  <UInput
                    type="checkbox"
                    pill
                    :value="tag"
                    :model-value="tags"
                    :label="tag"
                    @update:model-value="emit('update:tags', $event)"
                  />
                </li>
              </ul>
            </section>

            <!-- Баннер «Скидка 79%» (изображение Bannar.jpg) -->
            <section
              class="shop-filters__banner"
              aria-labelledby="shop-filters-banner-title"
            >
              <div class="shop-filters__banner-content">
                <h2 id="shop-filters-banner-title" class="shop-filters__banner-badge">
                  {{ t.discountBadge }}
                </h2>
                <p class="shop-filters__banner-text">{{ t.discountText }}</p>
                <span class="shop-filters__banner-link">
                  {{ t.discountLink }}
                  <Icon name="mdi:arrow-right" />
                </span>
              </div>
            </section>

            <!-- Товары со скидкой -->
            <section
              v-if="saleProducts.length"
              class="shop-filters__section"
              aria-labelledby="shop-filters-sale-title"
            >
              <h2 id="shop-filters-sale-title" class="visually-hidden">
                {{ t.saleTitle }}
              </h2>
              <ul class="shop-filters__sale-list">
                <li
                  v-for="prod in saleProducts"
                  :key="prod.documentId"
                  class="shop-filters__sale-item"
                >
                  <div class="shop-filters__sale-thumb">
                    <UImage
                      v-if="prod.mainImage?.url || prod.image?.length"
                      class="shop-filters__sale-image"
                      type="product"
                      :src="prod.mainImage?.url || prod.image?.[0]?.url"
                      :alt="prod.name"
                      width="44"
                      height="44"
                    />
                  </div>
                  <span class="shop-filters__sale-name">{{ prod.name }}</span>
                  <span class="shop-filters__sale-price">{{ formatPrice(prod.price) }}</span>
                </li>
              </ul>
            </section>
          </aside>
    </dialog>
  </div>
</template>

<style lang="scss" scoped>
.show-shop-filter {
  flex-shrink: 0;
  display: flex;
  @include adaptiveValue("width", 300, 200);

  // ===== Диалог сайдбара (без телепорта — в потоке страницы) =====
  &__dialog {
    // show() диалог по умолчанию absolute по центру — возвращаем в поток
    position: static;
    flex: 1;
    width: 100%;
    border: none;
    padding: 0;
    margin: 0;
    background: transparent;
    max-width: none;

    // Анимация (паттерн корзинного диалога, зеркально): при открытии выезжает
    // справа (translate 0), при закрытии уезжает влево (translate -100%)
    translate: -100%;
    opacity: 0;
    transition:
      translate var(--transition-duration),
      opacity var(--transition-duration),
      display var(--transition-duration) allow-discrete;

    &[open] {
      translate: 0;
      opacity: 1;
      display: block;
    }

    @starting-style {
      &[open] {
        translate: -100%;
        opacity: 0;
      }
    }
  }
}

// ===== Содержимое сайдбара фильтров =====
.shop-filters {
  width: 100%;
  flex-shrink: 0;
  color: var(--color);

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

  // ==== Цена (двойной ползунок — трек/ручки в UInput range-dual) ====
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
    margin: 0 0 toRem(4) 0;
    font-weight: 700;
    color: var(--success-color);
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

  &__sale-thumb {
    flex-shrink: 0;
    width: toRem(44);
    height: toRem(44);
    border-radius: toRem(4);
    overflow: hidden;
    // Узкий product-контейнер — UImage применяет @container product (миниатюра ≤ 16rem)
    @include containerParent(product, inline-size);
  }

  &__sale-image {
   width: 100%;
   height: 100%;
  }

  &__sale-item {
    display: flex;
    align-items: center;
    gap: toRem(8);
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
    flex: 1;
    min-width: 0;
  }

  &__sale-price {
    color: var(--success-color);
    font-weight: 600;
  }

  // ==== Адаптив ====
  @media (max-width: $mobile) {
    width: 100%;
    padding-block-end: toRem(30);

    &__tags {
      gap: toRem(6);
    }

    &__banner {
      min-height: toRem(100);
      padding: toRem(18) toRem(16);
    }
  }
}
</style>
