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

// Сайдбар открыт по умолчанию на desktop при каждом заходе на страницу: useDialog
// хранит isOpen в глобальном Map, который переживает размонтирование при SPA-навигации,
// поэтому принудительно сбрасываем состояние на «открыто» (как делал старый watch).
// На mobile (≤768) — диалог ЗАКРЫТ по умолчанию (открывается по кнопке «Фильтр»):
// SSR не знает ширину, поэтому открыт (десктоп-дефолт), а после маунта закрываем.
const { width } = useViewport()
isOpen.value = true
onMounted(() => {
  if (width.value <= 767.98) close?.()
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
// Блок нужен только на desktop: на mobile данные из Strapi НЕ запрашиваем
// (display:none всё равно тянул бы данные). server:false + immediate:false —
// без авто-запроса; запрос только после того, как ширина стала > mobile.
const { data: saleData, refresh } = useCachedAsyncData(
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
  { ttl: 600_000, server: false, immediate: false },
)

watch(width, (w) => {
  if (w > 767.98) refresh()
})

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
              </details>
              <!-- Контент — СЛУЖЕБНЫЙ сосед details (паттерн ShowHamburger):
                   анимация [open] + .content через grid-template-rows 0fr→1fr -->
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
              </details>
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
              </details>
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
  // Клип по ширине колонки: при exit-анимации диалог уезжает влево
  // (translate -100%) и обрезается у края колонки, а не вылезает за страницу
  overflow: hidden;
  // Схлопывание колонки откладываем на время exit-анимации диалога:
  // иначе :not(:has([open])) → display:none срабатывает мгновенно
  // и анимация закрытия не видна (паттерн картин/корзины — display с задержкой).
  // width тоже держим: иначе при снятии [open] ширина из :has исчезает,
  // родитель растягивается и диалог (width:100%) раздувается во время exit.
  // Ширина АНИМИРУЕТСЯ (width var(...), а не 0s+задержка): на desktop карточки
  // сдвигаются синхронно со слайдом диалога (без задержки)
  transition:
    display 0s var(--transition-duration) allow-discrete,
    width var(--transition-duration);

  // Сайдбар в потоке только пока диалог открыт. Закрытый — полностью убираем
  // из потока, чтобы не оставалась пустая колонка фиксированной ширины
  // (flex-gap в products__body тоже схлопывается вместе с ним).
  &:has(.show-shop-filter__dialog[open]) {
    // Ширина диалога — единый источник --filter-width (styles.scss)
    width: var(--filter-width);

    // Mobile (≤768): ширина области body (перебивает --filter-width)
    @media (max-width: $mobile) {
      width: 100%;
    }
  }

  &:not(:has(.show-shop-filter__dialog[open])) {
    display: none;
    // desktop: явный 0 для плавного схлопывания (transition: width выше);
    // mobile — не трогаем ширину (полноэкранный оверлей)
    @media (min-width: $mobile) {
      width: 0;
    }
  }

  // Mobile (≤768): оверлей заполняет .products-page__body (absolute inset:0).
  // body — flex-область под top-bar (см. products/index.vue .products-page_filter-open):
  // flex сам подстраивается под любую высоту breadcrumbs/top-bar — без замеров.
  @media (max-width: $mobile) {
    position: absolute;
    inset: 0;
    z-index: 9999;
  }

  // ===== Диалог сайдбара (без телепорта — в потоке страницы) =====
  &__dialog {
    // show() диалог по умолчанию absolute по центру — возвращаем в поток
    position: static;
    flex: 1;
    width: 100%;
    // display: block ВСЕГДА (перебивает UA dialog:not([open]){display:none}):
    // иначе при снятии [open] диалог мгновенно display:none и exit-анимация
    // (translate/opacity) умирает — видна только первая половина
    display: block;
    border: none;
    padding: 0;
    margin: 0;
    background: transparent;
    max-width: none;

    // Анимация: desktop — слева направо (translate -100%). Mobile — БЕЗ
    // translate (только opacity): translate:0 100% ломал скролл — при открытии
    // документ прокручивался вниз к хвосту преобразованного элемента.
    translate: -100%;
    opacity: 0;
    transition:
      translate var(--transition-duration),
      opacity var(--transition-duration);

    // Mobile (≤768): без движения (translate 0), только фейд; фон как в
    // ShowHamburger — прозрачный + blur; height:100% — чтобы .shop-filters
    // (height:100%) резолвился и скроллился
    @media (max-width: $mobile) {
      translate: 0;
      height: 100%;
      backdrop-filter: blur(22px);
    }

    &[open] {
      translate: 0;
      opacity: 1;
    }

    @starting-style {
      &[open] {
        translate: -100%;
        opacity: 0;

        @media (max-width: $mobile) {
          translate: 0;
        }
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
    // Разделитель «втиснение» (паттерн BannerLayouts): тёмная линия снизу +
    // светлый блик прямо под ней — вид вдавленной канавки
    border-bottom: toRem(1) solid rgba(0, 0, 0, 0.3);
    box-shadow:
      inset 0 toRem(-1) 0 rgba(0, 0, 0, 0.08),
      0 toRem(1) 0 rgba(255, 255, 255, 0.6);

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
      // Меньше текста summary (toEm(16)=1em давало размер текста)
      font-size: toEm(14);
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
    // Без рамки/outline/фона — просто название + иконка
    padding: 0;
    // На 4px меньше, чем было (toEm(22)) и тоньше (500)
    font-weight: 500;
    font-size: toEm(18);
    color: var(--primary-color);
    // Отступ снизу от summary ~8px
    margin-block-end: toRem(8);
    // Нативный маркер details скрываем (своя иконка)
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    @include hover {
      color: var(--warning-color);
    }
  }

  // Анимация details — точная копия ShowHamburger (content — сосед <details>):
  // [open] + .content через grid-template-rows 0fr→1fr
  &__details[open] + &__content {
    grid-template-rows: 1fr;
  }

  &__content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s;

    > * {
      overflow: hidden;
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
  &__price {
    // Ручки (16px) выступают за трек (4px) на 6-8px. content имеет overflow:hidden
    // (для grid-сворачивания details) — без паддингов ручки обрезаются
    padding-inline: toRem(8);
    padding-block-end: toRem(6);
  }

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

    // Блок не нужен на mobile: данные туда уже не подтягиваются,
    // display:none — страховка на случай resize desktop→mobile
    @media (max-width: $mobile) {
      display: none;
    }
  }

  &__sale-title {
    // Стиль как у summary details: шрифт 18, вес 500, отступ вниз 8px
    margin: 0 0 toRem(8) 0;
    font-weight: 500;
    font-size: toEm(18);
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
    // Заполняет fixed-оверлей (100dvh): скролл внутри вьюпорта, низ не обрезается
    height: 100%;
    // Внутренний скролл — как .dialog-hamburger__items в ShowHamburger
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--success-color) var(--whitesmoke-color);
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
