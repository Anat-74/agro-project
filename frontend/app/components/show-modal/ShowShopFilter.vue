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

// Диалог сайдбара фильтров: show() (не модальный), как ShowHamburger.
// initialOpen: true — SSR сразу отдаёт <dialog open>, без флеша после гидратации
// (см. session-handoff, замечание 5, вариант А).
const dialogElement = useTemplateRef<HTMLDialogElement>("dialog-shop-filter");
const { open, close, isOpen } = useDialog("shopFilterDialog", dialogElement, {
  useShowMethod: true,
  initialOpen: true,
})

// Сайдбар открыт по умолчанию на каждом заходе на страницу: useDialog хранит
// isOpen в глобальном Map, который переживает размонтирование при SPA-навигации,
// поэтому принудительно сбрасываем состояние на «открыто» (как делал старый watch).
isOpen.value = true

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
    populate: {
      products: { fields: ["id"] },
      // Товары подкатегорий тоже считаем: у товара category может быть null,
      // а категория достижима только через subcategory.category
      subcategories: {
        fields: ["id", "name", "slug"],
        populate: { products: { fields: ["id"] } },
      },
    },
  } as any),
  { ttl: 600_000 },
)

const categories = computed(() => (categoriesData.value?.data as Category[] | undefined) ?? [])
const categoryCount = (cat: Category) =>
  (cat.products?.length ?? 0) +
  (cat.subcategories?.reduce((n, s) => n + (s.products?.length ?? 0), 0) ?? 0)

// ===== Открытое состояние details-секций (реактивно — переживает ре-рендер) =====
const categoriesOpen = ref(true)
const priceOpen = ref(true)
const tagsOpen = ref(true)

// Клик по summary переключает НАТИВНЫЙ атрибут details (open), Vue об этом
// не знает: без синхронизации следующий ре-рендер принудительно вернёт секцию
// в состояние ref (переоткроет закрытую). Синхронизируем ref по событию toggle.
const onDetailsToggle = (key: "categories" | "price" | "tags", e: Event) => {
  const opened = (e.currentTarget as HTMLDetailsElement).open
  if (key === "categories") categoriesOpen.value = opened
  else if (key === "price") priceOpen.value = opened
  else tagsOpen.value = opened
}

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
    <dialog id="dialogShopFilter" ref="dialog-shop-filter" class="show-shop-filter__dialog" :aria-label="t.filterTitle" :open="isOpen">
      <aside class="shop-filters">
            <!-- Категории: скрытый заголовок (у section обязан быть) -->
            <section
              class="shop-filters__section"
              aria-labelledby="shop-filters-categories-title"
            >
              <h2 id="shop-filters-categories-title" class="visually-hidden">
                {{ t.categoriesTitle }}
              </h2>
              <details class="shop-filters__details" :open="categoriesOpen" @toggle="onDetailsToggle('categories', $event)">
                <summary class="shop-filters__summary">
                  <span class="shop-filters__summary-title">{{ t.categoriesTitle }}</span>
                  <Icon name="mingcute:down-line" />
                </summary>
                <div class="shop-filters__content">
                  <ul class="shop-filters__category-list">
                    <li class="shop-filters__category">
                      <UInput
                        class="shop-filters__category-input"
                        type="radio"
                        name="shop-category"
                        value=""
                        :model-value="category"
                        :label="t.allProducts"
                        @update:model-value="emit('update:category', $event)"
                      />
                    </li>
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
                </div>
              </details>
            </section>

            <!-- Цена (двойной ползунок — UInput range-dual) -->
            <section
              class="shop-filters__section"
              aria-labelledby="shop-filters-price-title"
            >
              <h2 id="shop-filters-price-title" class="visually-hidden">
                {{ t.priceTitle }}
              </h2>
              <details class="shop-filters__details" :open="priceOpen" @toggle="onDetailsToggle('price', $event)">
                <summary class="shop-filters__summary">
                  <span class="shop-filters__summary-title">{{ t.priceTitle }}</span>
                  <Icon name="mingcute:down-line" />
                </summary>
                <div class="shop-filters__content">
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
                </div>
              </details>
            </section>

            <!-- Популярные теги (UInput checkbox-пилюли, модель — массив) -->
            <section
              class="shop-filters__section"
              aria-labelledby="shop-filters-tags-title"
            >
              <h2 id="shop-filters-tags-title" class="visually-hidden">
                {{ t.tagsTitle }}
              </h2>
              <details class="shop-filters__details" :open="tagsOpen" @toggle="onDetailsToggle('tags', $event)">
                <summary class="shop-filters__summary">
                  <span class="shop-filters__summary-title">{{ t.tagsTitle }}</span>
                  <Icon name="mingcute:down-line" />
                </summary>
                <div class="shop-filters__content">
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
                </div>
              </details>
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

            <!-- Товары со скидкой (без details — переиспользуем DiscountProduct) -->
            <section
              v-if="saleProducts.length"
              class="shop-filters__section shop-filters__sale-section"
              aria-labelledby="shop-filters-sale-title"
            >
              <h2 id="shop-filters-sale-title" class="shop-filters__sale-title">
                {{ t.saleTitle }}
              </h2>
              <ul class="shop-filters__sale-list">
                <DiscountProduct
                  v-for="(prod, index) in saleProducts"
                  :key="prod.documentId"
                  :product="prod"
                  :index="index"
                />
              </ul>
            </section>
          </aside>
    </dialog>
  </div>
</template>

<style lang="scss" scoped>
.show-shop-filter {
  display: flex;
  flex-shrink: 0;

  // Сайдбар в потоке только пока диалог открыт. Закрытый — полностью убираем
  // из потока, чтобы не оставалась пустая колонка фиксированной ширины
  // (flex-gap в products__body тоже схлопывается вместе с ним).
  &:has(.show-shop-filter__dialog[open]) {
    @include adaptiveValue("width", 300, 200);
  }

  &:not(:has(.show-shop-filter__dialog[open])) {
    display: none;
  }

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
    // Разделитель «втиснение» (паттерн BannerLayouts: тёмная линия + светлый блик)
    border-bottom: toRem(1) solid rgba(0, 0, 0, 0.25);
    box-shadow: 0 toRem(1) 0 rgba(255, 255, 255, 0.4);

    &:last-child {
      border-bottom: none;
      box-shadow: none;
      margin-block-end: 0;
      padding-block-end: 0;
    }
  }

  // ==== Details-секции (паттерн ShowHamburger: grid 0fr→1fr + шеврон) ====
  &__details {
    svg {
      font-size: toEm(22);
      transition: rotate var(--transition-duration);
    }

    &[open] .shop-filters__summary svg {
      rotate: -90deg;
    }
  }

  &__summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: toRem(8);
    cursor: pointer;
    padding: toEm(4);
    font-weight: 600;
    font-size: toEm(22);
    color: var(--primary-color);
    outline: toRem(2) var(--whitesmoke-color) inset;
    border-radius: toRem(4);
    background-color: var(--light-color-transparent);
    // Нативный маркер details скрываем (своя иконка)
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    @include hover {
      color: var(--warning-color);
    }
  }

  &__content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s;

    > * {
      overflow: hidden;
      min-height: 0;
    }
  }

  &__details[open] .shop-filters__content {
    grid-template-rows: 1fr;
  }

  &__summary-title {
    font-weight: 600;
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
    // Числа стоимости — над инпутом на 5px
    margin-block-end: toRem(5);
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

  // ==== Товары со скидкой (DiscountProduct; контейнер для container-query) ====
  &__sale-section {
    // Родитель-контейнер: карточки адаптируются к ширине сайдбара,
    // а не к вьюпорту (см. @container sale ниже)
    @include containerParent(sale, inline-size);
  }

  &__sale-title {
    margin: 0 0 toRem(16) 0;
    font-weight: 600;
    font-size: toEm(22);
    color: var(--primary-color);
  }

  &__sale-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: toRem(12);
  }

  // В узком сайдбаре DiscountProduct принудительно переводим в компактную
  // раскладку (как у него в @media (max-width: toEm(540))) — иначе карточка
  // рендерится в широкой 3-колоночной сетке по ширине вьюпорта.
  @container sale (max-width: 26rem) {
    .shop-filters__sale-list :deep(.discount-card) {
      grid-template-columns: repeat(2, auto);
      row-gap: toEm(8);
      grid-template-areas:
        "link show"
        "title add"
        "price add";
    }
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
