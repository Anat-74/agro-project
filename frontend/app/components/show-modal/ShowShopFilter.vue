<script setup lang="ts">
import { shopFiltersTranslations } from '~/locales/shopFilters'
import { productFilterTranslations } from '~/locales/productFilter'
import { buttonTranslations } from '~/locales/button'

const { find } = useStrapi();
const { currentLocale } = useLocale();
const t = computed(() => shopFiltersTranslations[currentLocale.value])
const pf = computed(() => productFilterTranslations[currentLocale.value])
const bt = computed(() => buttonTranslations[currentLocale.value])

interface Props {
  category?: string
  priceMin?: number
  priceMax?: number
  tags?: string[]
  sort?: string
  // Блок фильтров (тулбар), за уходом которого следим для плавающей кнопки
  observeTarget?: string
}

const props = withDefaults(defineProps<Props>(), {
  category: "",
  priceMin: 0,
  priceMax: 2000,
  tags: () => [],
  sort: "name:asc",
  observeTarget: ".products-page__container-top",
})

const emit = defineEmits<{
  "update:category": [v: string]
  "update:priceMin": [v: number]
  "update:priceMax": [v: number]
  "update:tags": [v: string[]]
  "update:sort": [v: string]
}>()

// Диалог сайдбара фильтров: show() (не модальный), как ShowHamburger.
// initialOpen: false — на входе диалог ЗАКРЫТ (SSR тоже): нет «флипа» контента
// на mobile. На desktop панель открывает СТРАНИЦА после загрузки товаров
// (O2, plan.md §1: watcher на status === 'success' в products/index.vue).
const dialogElement = useTemplateRef<HTMLDialogElement>("dialog-shop-filter");
const { close, isOpen } = useDialog("shopFilterDialog", dialogElement, {
  useShowMethod: true,
  initialOpen: false,
})

// Панель фильтров теперь В ПОТОКЕ (вариант 2). Не вызываем dialog.show(): он
// прокручивает документ к диалогу и сбивает позицию скролла при открытии.
// Открытие — только реактивным :open (isOpen). close() (el.close + isOpen=false) оставляем.
const open = () => {
  isOpen.value = true
}
const toggle = () => {
  if (isOpen.value) close()
  else open()
}

// width нужен для sale-секции (запрос только на desktop) и кнопки-логики
const { width } = useViewport()

// Управление диалогом из страницы (кнопка «Фильтр» в top-bar):
// toggle приходит из useDialog (открыт→закрыть, закрыт→открыть).
defineExpose({ open, close, isOpen, toggle })

// ===== Плавающая кнопка «Фильтр» (mobile) — самодостаточность компонента =====
// Компонент сам управляет открытием и умеет показывать свою кнопку-плавашку,
// когда "родной" блок фильтров ушёл за верх при скролле. Появляется/исчезает
// плавно (GPU: opacity/transform), скрыта при открытом диалоге (оверлей).
// viewportReady: ширина на SSR неизвестна (0 → 0<=767 = true) — гейтим, чтобы
// плавашка не рендерилась на сервере/desktop (иначе SSR-флип).
const viewportReady = ref(false)
const isMobile = computed(() => viewportReady.value && width.value <= 767.98)
const toolbarGone = ref(false)
// Плавашка: появляется только когда фильтр ЗАКРЫТ и нативный тулбар уехал за верх
// (при открытом фильтре тулбар липкий и всегда доступен — плавашку скрываем).
const floatVisible = computed(
  () => isMobile.value && toolbarGone.value && !isOpen.value,
)

let observer: IntersectionObserver | undefined
onMounted(() => {
  if (!import.meta.client) return
  viewportReady.value = true
  if (!isMobile.value) return
  const el = document.querySelector(props.observeTarget)
  if (!el) return
  observer = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0]
      if (!entry) return
      // Блок ушёл за верх (не пересекает вьюпорт) → показываем плавашку
      toolbarGone.value = !entry.isIntersecting
    },
    { threshold: 0 },
  )
  observer.observe(el)
})
onUnmounted(() => observer?.disconnect())

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

// Общее количество для «Все товары» — сумма по категориям (товар принадлежит
// одной категории/подкатегории, поэтому двойной счёт исключён; берётся из уже
// загруженных категорий, без отдельного запроса).
const totalProducts = computed(() =>
  categories.value.reduce((n, cat) => n + categoryCount(cat), 0),
)

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

// Ввод диапазона руками (input type=number). Коммит по @change (blur/Enter),
// кламп в [0, PRICE_MAX] и min ≤ max; ползунок подхватывает через
// :model-value="[localMin, localMax]" → onRangeChange.
const clampPrice = (v: number) => Math.min(PRICE_MAX, Math.max(0, Math.round(v || 0)))

// Сортировка в шапке панели: USelect через v-model (прокси) — эмитим update:sort.
const sortLocal = computed<string>({
  get: () => props.sort ?? "name:asc",
  set: (v) => emit("update:sort", v),
})

const onPriceInput = (key: "min" | "max", e: Event) => {
  const raw = Number((e.target as HTMLInputElement).value)
  if (Number.isNaN(raw)) return
  if (key === "min") onRangeChange([clampPrice(Math.min(raw, localMax.value)), localMax.value])
  else onRangeChange([localMin.value, clampPrice(Math.max(raw, localMin.value))])
}

</script>

<template>
  <div class="show-shop-filter">
    <!-- Панель фильтров — в потоке и на desktop, и на mobile (вариант 2): mobile
         работает как desktop — колонка слева с анимируемой шириной, карточки
         сдвигаются вправо. Телепорт в body больше не нужен, поэтому Teleport
         оставлен `disabled` (рендер на месте), fixed-оверлея на mobile нет. -->
    <Teleport to="body" disabled>
      <dialog id="dialogShopFilter" ref="dialog-shop-filter" class="show-shop-filter__dialog" :aria-label="t.filterTitle" :open="isOpen">
      <!-- Шапка панели: сортировка + закрытие. При открытом фильтре тулбар страницы
           скрыт — его контролы берёт эта шапка (крестик закрывает, Escape тоже). -->
      <header class="shop-filters__header">
        <!-- Порядок: кнопка слева, селект справа -->
        <UButton
          class="shop-filters__close"
          :aria-label="bt.ariaLabelDialogClosed"
          :aria-expanded="isOpen"
          aria-controls="dialogShopFilter"
          @click="close?.()"
        >
          <span class="shop-filters__filter-icon">
            <Transition name="filter-icon" mode="out-in">
              <Icon v-if="isOpen" key="close" name="mingcute:close-line" />
              <Icon v-else key="filter" name="mingcute:filter-line" />
            </Transition>
          </span>
        </UButton>
        <USelect
          v-model="sortLocal"
          class="shop-filters__sort"
          :label="t.sortLabel"
          :options="[
            { value: 'name:asc', label: pf.optionName },
            { value: 'price:asc', label: pf.optionPrice },
            { value: 'price:desc', label: pf.optionPriceDesc },
          ]"
        />
      </header>

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
                    <span class="shop-filters__category-count">({{ totalProducts }})</span>
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
                  <UInput
                    type="range-dual"
                    :min="0"
                    :max="PRICE_MAX"
                    :model-value="[localMin, localMax]"
                    @update:model-value="onRangeChange"
                  />
                  <div class="shop-filters__price-values">
                    <input
                      class="shop-filters__price-value-input"
                      type="number"
                      :min="0"
                      :max="PRICE_MAX"
                      step="1"
                      :value="localMin"
                      aria-label="Минимальная цена"
                      @input="onPriceInput('min', $event)"
                      @change="onPriceInput('min', $event)"
                    >
                    <span class="shop-filters__price-separator">—</span>
                    <input
                      class="shop-filters__price-value-input"
                      type="number"
                      :min="0"
                      :max="PRICE_MAX"
                      step="1"
                      :value="localMax"
                      aria-label="Максимальная цена"
                      @input="onPriceInput('max', $event)"
                      @change="onPriceInput('max', $event)"
                    >
                  </div>
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
    </Teleport>

    <!-- Плавающая кнопка «Фильтр» (mobile): появляется, когда блок фильтров
         ушёл за верх, исчезает при возврате/при открытом диалоге. Телепорт в
         body — чтобы position:fixed не ломался о transform-предка, и только на
         клиенте (v-if=isMobile на SSR false → без SSR-флипа). -->
    <Teleport to="body">
      <button
        v-if="isMobile"
        type="button"
        class="show-shop-filter__float"
        :class="{ 'show-shop-filter__float_visible': floatVisible }"
        :aria-label="t.filterTitle"
        :aria-expanded="isOpen"
        aria-controls="dialogShopFilter"
        @click="toggle"
      >
        <span class="show-shop-filter__float-icon">
          <Transition name="filter-icon" mode="out-in">
            <Icon v-if="isOpen" key="close" name="mingcute:close-line" />
            <Icon v-else key="filter" name="mingcute:filter-line" />
          </Transition>
        </span>
        <span>{{ t.filterTitle }}</span>
      </button>
    </Teleport>
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
    display 0s var(--transition-duration-fast) allow-discrete,
    width var(--transition-duration-fast);

  // Ширина панели: mobile — фикс (--filter-drawer-w, styles.scss), desktop —
  // адаптив (--filter-width). Поток одинаковый для обеих ширин (вариант 2).
  --filter-panel-w: var(--filter-width);

  @media (max-width: $mobile) {
    --filter-panel-w: var(--filter-drawer-w);
  }

  // Сайдбар в потоке только пока диалог открыт: закрытый схлопываем в 0
  // (переход width выше), затем display:none (с задержкой) — пустой колонки нет.
  &:has(.show-shop-filter__dialog[open]) {
    width: var(--filter-panel-w);
  }

  &:not(:has(.show-shop-filter__dialog[open])) {
    width: 0;
    display: none;
  }

  // Desktop/планшет: панель sticky, вьюпорт-высота + внутренний скролл диалога.
  align-self: flex-start;
  position: sticky;
  top: toRem(12);
  height: calc(100dvh - toRem(24));

  // Mobile: панель — sticky на высоту вьюпорта со СВОИМ внутренним скроллом
  // (диалог скроллится): фильтры всегда видны и прокручиваются независимо от товаров.
  // Верх — под липкими крошками (--crumb-h), страница сдвинута на --header-h (transform).
  @media (max-width: $mobile) {
    position: sticky;
    top: calc(var(--header-h, 0px) + var(--crumb-h, 0px));
    align-self: flex-start;
    height: calc(100dvh - var(--crumb-h, 0px));
  }

  // ===== Диалог сайдбара (на desktop — в потоке; на mobile — drawer в body) =====
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
    // Внутренний вертикальный скролл — на всех ширинах: высота 100% от sticky-панели.
    // scrollbar-gutter — место под полосу, чтобы она не наезжала на выровненные
    // вправо счётчики («(31)»).
    height: 100%;
    // x — hidden: широкие элементы внутри (бегущая строка промо-баннера) иначе дают
    // горизонтальный скроллбар у панели; y — auto (внутренний вертикальный скролл).
    overflow: hidden auto;
    scrollbar-gutter: stable;
    // Скролл фильтров не «пробрасывается» на страницу: пока в панели есть что
    // скроллить — страница стоит; дошёл до края — страница не уезжает сразу.
    overscroll-behavior: contain;

    // Внутренние боковые отступы — как были у mobile-оверлея (кнопка/сортировка)
    @media (max-width: $mobile) {
      padding-inline: toRem(9);
    }

    // Анимация: desktop — слева направо (translate -100%). Mobile — БЕЗ
    // translate (только opacity): translate:0 100% ломал скролл — при открытии
    // документ прокручивался вниз к хвосту преобразованного элемента.
    translate: -100%;
    opacity: 0;
    transition:
      translate var(--transition-duration-fast),
      opacity var(--transition-duration-fast);

    &[open] {
      translate: 0;
      opacity: 1;
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

  // Здесь только секции фильтров (сортировка и закрытие — в липком тулбаре страницы).

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

  // Первая секция («Все категории») на mobile: без верхнего бордера и с минимальным
  // отступом сверху (верх списка фильтров начинается сразу).
  &__section:first-of-type {
    @media (max-width: $mobile) {
      padding-block-start: toRem(4);
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
      // min-height:0 обязателен: без него grid-ряд 0fr не может схлопнуться
      // ниже min-content ребёнка — у цены это линия слайдера (4px), поэтому
      // при закрытии details ползунок оставался виден, а числа обрезались.
      min-height: 0;
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
  // Вертикальный/горизонтальный запас под ручки теперь ВНУТРИ трека (UInput),
  // поэтому у блока цены паддингов нет. Иначе: padding-block-end с content-box
  // оставлял 6px-«хвост», в который помещалась линия слайдера (4px) — секция
  // не схлопывалась полностью, а верх ручки резался overflow:hidden.
  &__price {
    padding: 0;
  }

  &__price-values {
    display: flex;
    align-items: center;
    gap: toRem(8);
    font-size: toEm(15);
    color: var(--color);
    // Числа стоимости — ПОД инпутом с отступом от ползунка (было 5px — прижато)
    margin-block-start: toRem(12);
  }

  // Инпуты диапазона цены (user может ввести диапазон руками)
  &__price-value-input {
    width: toEm(72);
    padding: toEm(2) toEm(6);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(4);
    color: var(--color);
    background-color: var(--bg);
    text-align: center;
    font-size: toEm(14);
    // Скрыть «стрелочки» number в некоторых браузерах (аккуратно, только webkit)
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    &[type="number"] {
      -moz-appearance: textfield;
      appearance: textfield;
    }
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
    // Скролл — на самой панели (.show-shop-filter__dialog), как на desktop;
    // здесь остаются только мобильные нюансы контента.
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

// ===== Шапка панели (mobile): сортировка + закрытие =====
// Скрыта на desktop (там сортировка/кнопка в тулбаре страницы). Sticky — всегда видна
// при внутреннем скролле списка фильтров.
.shop-filters__header {
  display: none;

  @media (max-width: $mobile) {
    // Sticky внутри скроллящегося диалога: шапка (кнопка + селект) всегда сверху
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: toRem(10);
    padding: toRem(10) 0 toRem(12);
    border-bottom: toRem(1) solid rgba(0, 0, 0, 0.08);
    background-color: var(--bg);

    .shop-filters__sort {
      // Селект — справа (кнопка закрытия слева)
      margin-inline-start: auto;
      width: fit-content;
      flex: 0 1 auto;
      min-width: 0;
    }

    .shop-filters__close {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      height: toRem(30);
      padding: 0 toRem(12);
      background-color: var(--green-color);
      color: var(--light-color);
      border: toRem(1) solid var(--border-color);
      border-radius: toRem(6);
      cursor: pointer;

      svg {
        color: var(--light-color);
        width: toRem(20);
        height: toRem(20);
        flex-shrink: 0;
      }
    }
  }
}

// Иконка filter ↔ крестик (тот же Transition, что у кнопки в тулбаре).
.shop-filters__filter-icon {
  display: inline-flex;

  .filter-icon-enter-active,
  .filter-icon-leave-active {
    transition:
      opacity var(--transition-duration),
      transform var(--transition-duration);
  }

  .filter-icon-enter-from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.5);
  }

  .filter-icon-leave-to {
    opacity: 0;
    transform: rotate(90deg) scale(0.5);
  }
}

// ===== Плавающая кнопка «Фильтр» (mobile, самодостаточность компонента) =====
// Top-level (не вложено в .show-shop-filter): кнопка телепортируется в body,
// поэтому селектор `.show-shop-filter .show-shop-filter__float` не совпадал бы.
.show-shop-filter__float {
  position: fixed;
  left: toRem(16);
  bottom: toRem(16);
  z-index: 9998;
  display: inline-flex;
  align-items: center;
  gap: toRem(6);
  height: toRem(36);
  padding: 0 toRem(12);
  background-color: var(--green-color);
  color: var(--light-color);
  border: toRem(1) solid var(--border-color);
  border-radius: toRem(18);
  font-size: toEm(14);
  font-weight: 600;
  box-shadow: 0 toRem(4) toRem(18) rgba(0, 0, 0, 0.18);
  cursor: pointer;
  // Скрыта по умолчанию (появляется ._visible) — только GPU-свойства
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(toRem(12));
  transition:
    opacity var(--transition-duration),
    transform var(--transition-duration),
    visibility 0s var(--transition-duration) allow-discrete;

  svg {
    color: var(--light-color);
    width: toRem(16);
    height: toRem(16);
    flex-shrink: 0;
  }

  // Анимация иконки filter ↔ close (как у кнопки в тулбаре страницы)
  &-icon {
    display: inline-flex;

    .filter-icon-enter-active,
    .filter-icon-leave-active {
      transition:
        opacity var(--transition-duration),
        transform var(--transition-duration);
    }

    .filter-icon-enter-from {
      opacity: 0;
      transform: rotate(-90deg) scale(0.5);
    }

    .filter-icon-leave-to {
      opacity: 0;
      transform: rotate(90deg) scale(0.5);
    }
  }

  &_visible {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translateY(0);
    transition:
      opacity var(--transition-duration),
      transform var(--transition-duration);
  }
}
</style>
