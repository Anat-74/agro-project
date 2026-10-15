<script setup lang="ts">
import { shopFiltersTranslations } from '~/locales/shopFilters'
import { productFilterTranslations } from '~/locales/productFilter'
import { buttonTranslations } from '~/locales/button'

const { find } = useStrapi();
const { currentLocale } = useLocale();
const t = computed(() => shopFiltersTranslations[currentLocale.value])
const pf = computed(() => productFilterTranslations[currentLocale.value])
const bt = computed(() => buttonTranslations[currentLocale.value])

// Иконка И цвет категории по slug — мэппинг в КОДЕ (без нового поля в Strapi).
// Цвета — из палитры --cat-* (styles.scss). Неизвестный slug → нейтральная иконка.
type CategoryVisual = { icon: string; color: string };
const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  frukty: { icon: "mdi:food-apple", color: "var(--cat-fruit)" },
  ovoshhi: { icon: "mdi:corn", color: "var(--cat-veg)" },
  zelen: { icon: "mdi:leaf", color: "var(--cat-greens)" },
  korneplody: { icon: "mdi:carrot", color: "var(--cat-root)" },
  yagody: { icon: "mdi:fruit-cherries", color: "var(--cat-berry)" },
  bobovye: { icon: "mdi:seed-outline", color: "var(--cat-legume)" },
  "orehi-i-suhofrukty": { icon: "mdi:peanut", color: "var(--cat-nut)" },
  "posadka-i-urozhay": { icon: "mdi:sprout", color: "var(--cat-garden)" },
  zagotovki: { icon: "mdi:package-variant", color: "var(--cat-preserve)" },
  "varenie-dzhem": { icon: "mdi:pot", color: "var(--cat-jam)" },
  "kompoty-soki": { icon: "mdi:bottle-soda-outline", color: "var(--cat-drink)" },
};
// Пункт «Все товары»
const ALL_PRODUCTS_VISUAL: CategoryVisual = {
  icon: "mdi:basket-outline",
  color: "var(--cat-all)",
};
const categoryVisual = (slug: string): CategoryVisual =>
  CATEGORY_VISUALS[slug] ?? { icon: "mdi:food-variant", color: "var(--gray-color)" };

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
  // Свежесть категорий: 5 минут (было 10)
  { ttl: 300_000 },
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

// ===== Диапазон цены (пресеты-чипы + поля «своего диапазона») =====
// Локальное состояние полей/чипов; синхронизируется с props (см. watch ниже).
const localMin = ref(props.priceMin)
const localMax = ref(props.priceMax)

// Внешние изменения (кнопка «Сбросить фильтры» на странице, back/forward, прямая
// ссылка) должны отражаться в полях/чипах — иначе панель показывает старый
// диапазон, а выдача уже без него.
watch(
  () => [props.priceMin, props.priceMax] as const,
  ([mn, mx]) => {
    if (mn !== localMin.value) localMin.value = mn
    if (mx !== localMax.value) localMax.value = mx
  },
)

const onRangeChange = (range: [number, number]) => {
  localMin.value = range[0]
  localMax.value = range[1]
  emit("update:priceMin", range[0])
  emit("update:priceMax", range[1])
}

// Ввод диапазона руками (input type=number). Коммит по @change (blur/Enter),
// кламп в [0, PRODUCTS_PRICE_MAX] и min ≤ max.
const clampPrice = (v: number) => Math.min(PRODUCTS_PRICE_MAX, Math.max(0, Math.round(v || 0)))

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

// ===== Пресеты цены (5 чипов) =====
// Границы — от РЕАЛЬНОГО разброса цен каталога (мин/макс), а не от общего
// PRODUCTS_PRICE_MAX: реальные цены ~0.5–19, «0..2000» не отражает данные.
// Два лёгких запроса (по 1 товару, price:asc/desc) с кэшем на локаль.
const { data: priceRange } = useCachedAsyncData(
  `shop-price-range-${currentLocale.value}`,
  async () => {
    const one = (dir: "asc" | "desc") => ({
      sort: [`price:${dir}`],
      pagination: { pageSize: 1 },
      fields: ["price"],
      filters: { locale: { $eq: currentLocale.value } },
    } as any)
    const [lo, hi] = await Promise.all([
      find("products", one("asc")),
      find("products", one("desc")),
    ])
    return {
      min: Number((lo.data as any)?.[0]?.price ?? 0),
      max: Number((hi.data as any)?.[0]?.price ?? 0),
    }
  },
  // Свежесть диапазона цен: 5 минут (было 10)
  { ttl: 300_000 },
)

type PricePreset = { id: string; label: string; min: number; max: number }
const pricePresets = computed<PricePreset[]>(() => {
  const r = priceRange.value
  if (!r || !(r.max > r.min)) return []
  const min = Math.floor(r.min)
  const max = Math.ceil(r.max)
  const span = max - min
  const b = (i: number) => Math.round(min + (span * i) / 4)
  const q1 = b(1)
  const q2 = b(2)
  const q3 = b(3)
  return [
    { id: "all", label: t.value.priceAll, min, max },
    { id: "q1", label: `${t.value.priceUpTo} ${q1}`, min, max: q1 },
    { id: "q2", label: `${q1}–${q2}`, min: q1, max: q2 },
    { id: "q3", label: `${q2}–${q3}`, min: q2, max: q3 },
    { id: "q4", label: `${t.value.priceFrom} ${q3}`, min: q3, max },
  ]
})

// Активен ли пресет («Все» = текущий диапазон не уже полного)
const isPricePresetActive = (p: PricePreset) => {
  if (p.id === "all") return localMin.value <= p.min && localMax.value >= p.max
  return localMin.value === p.min && localMax.value === p.max
}

const selectPricePreset = (p: PricePreset) => onRangeChange([p.min, p.max])

// Поля ввода: при фокусе число исчезает (паттерн UInput clearOnFocus — как в
// категориях «Посадка»/«Заготовки»); при уходе пустым возвращаем прежнее значение.
const onPriceFieldFocus = (e: FocusEvent) => {
  const el = e.target as HTMLInputElement
  el.value = ""
}
const onPriceFieldBlur = (key: "min" | "max", e: FocusEvent) => {
  const el = e.target as HTMLInputElement
  if (el.value === "") el.value = String(key === "min" ? localMin.value : localMax.value)
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
        <!-- Кнопка закрытия фильтров — на своём месте (шапка панели). Тёмный фон
             (как цвет фонового изображения), крестик белый; пропорции как раньше
             (22px, «+1px» толщина). Анимация filter↔close сохранена. -->
        <UButton
          class="shop-filters__close"
          variant="plain"
          :aria-label="bt.ariaLabelDialogClosed"
          :aria-expanded="isOpen"
          aria-controls="dialogShopFilter"
          @click="close?.()"
        >
          <Transition name="filter-icon" mode="out-in">
            <Icon v-if="isOpen" key="close" name="mingcute:close-line" />
            <Icon v-else key="filter" name="mingcute:filter-line" />
          </Transition>
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
                  <li
                    class="shop-filters__category"
                    :class="{ 'shop-filters__category_is-active': category === '' }"
                  >
                    <Icon
                      :name="ALL_PRODUCTS_VISUAL.icon"
                      :style="{ color: ALL_PRODUCTS_VISUAL.color }"
                      class="shop-filters__category-icon"
                      aria-hidden="true"
                    />
                    <UInput
                      class="shop-filters__category-input"
                      type="radio"
                      name="shop-category"
                      value=""
                      :model-value="category"
                      :label="t.allProducts"
                      @update:model-value="emit('update:category', $event)"
                    />
                    <Icon
                      v-if="category === ''"
                      name="mdi:check"
                      class="shop-filters__category-check"
                      aria-hidden="true"
                    />
                    <span class="shop-filters__category-count">({{ totalProducts }})</span>
                  </li>
                  <li
                    v-for="cat in categories"
                    :key="cat.slug"
                    class="shop-filters__category"
                    :class="{ 'shop-filters__category_is-active': category === cat.slug }"
                  >
                    <Icon
                      :name="categoryVisual(cat.slug).icon"
                      :style="{ color: categoryVisual(cat.slug).color }"
                      class="shop-filters__category-icon"
                      aria-hidden="true"
                    />
                    <UInput
                      class="shop-filters__category-input"
                      type="radio"
                      name="shop-category"
                      :value="cat.slug"
                      :model-value="category"
                      :label="cat.name"
                      @update:model-value="emit('update:category', $event)"
                    />
                    <Icon
                      v-if="category === cat.slug"
                      name="mdi:check"
                      class="shop-filters__category-check"
                      aria-hidden="true"
                    />
                    <span class="shop-filters__category-count">({{ categoryCount(cat) }})</span>
                  </li>
                </ul>
              </div>
            </section>

            <!-- Цена: пресеты-чипы + поля «своего диапазона» -->
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
                  <!-- Пресеты-диапазоны (5) — основной способ выбора на мобильном -->
                  <ul v-if="pricePresets.length" class="shop-filters__price-presets">
                    <li v-for="p in pricePresets" :key="p.id">
                      <button
                        type="button"
                        class="shop-filters__price-preset"
                        :class="{
                          'shop-filters__price-preset_is-active': isPricePresetActive(p),
                        }"
                        :aria-pressed="isPricePresetActive(p)"
                        @click="selectPricePreset(p)"
                      >
                        {{ p.label }}
                      </button>
                    </li>
                  </ul>
                  <!-- Свой диапазон — числовые поля (альтернатива пресетам).
                       При фокусе число исчезает (как в категориях Посадки/Заготовок). -->
                  <p class="shop-filters__price-custom">
                    {{ t.priceCustom }}
                  </p>
                  <div class="shop-filters__price-values">
                    <input
                      class="shop-filters__price-value-input"
                      type="number"
                      :min="0"
                      :max="PRODUCTS_PRICE_MAX"
                      step="1"
                      :value="localMin"
                      aria-label="Минимальная цена"
                      @focus="onPriceFieldFocus"
                      @blur="onPriceFieldBlur('min', $event)"
                      @input="onPriceInput('min', $event)"
                      @change="onPriceInput('min', $event)"
                    >
                    <span class="shop-filters__price-separator">—</span>
                    <input
                      class="shop-filters__price-value-input"
                      type="number"
                      :min="0"
                      :max="PRODUCTS_PRICE_MAX"
                      step="1"
                      :value="localMax"
                      aria-label="Максимальная цена"
                      @focus="onPriceFieldFocus"
                      @blur="onPriceFieldBlur('max', $event)"
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

        <!-- Кнопка-шеврон прокрутки панели: sticky внизу диалога. Скрыта, когда
             весь контент виден; внизу переворачивается вверх (см. UScrollNav). -->
        <UScrollNav
          mode="toggle"
          variant="plain"
          :target="dialogElement"
          icon-down="mdi:chevron-double-down"
          icon-up="mdi:chevron-double-up"
          class="shop-filters__scroll-nav"
        />
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
  // Декоративный разделитель между панелью фильтров и контентом (вместо
  // «пустого» зазора) — тонкая линия + мягкая тень: панель читается как колонка.
  border-inline-end: toRem(1) solid var(--border-color);
  box-shadow: toRem(2) 0 toRem(10) rgba(0, 0, 0, 0.06);
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
    // Ширина панели = полная ширина drawer (165px): полоса скролла встаёт у правого
    // края панели — ровно на границе с полем карточек (колонка сдвинута на 7+165).
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

  // Mobile: панель FIXED — фильтры всегда на виду и НЕ зависят от скролла карточек.
  // Сдвиг уехавшей шапки теперь на header/списке карточек (не на .products-page),
  // поэтому у панели нет трансформированного предка → fixed честно от вьюпорта.
  // Верх — под липкими крошками, низ — по низу вьюпорта; скролл — внутри диалога.
  @media (max-width: $mobile) {
    position: fixed;
    top: var(--crumb-h, 0px);
    left: toRem(5); // = контейнерный padding-inline на mobile (при открытом фильтре)
    z-index: 40;
    // Постоянная высота (без ресайза при скролле). Подвал при открытом фильтре скрыт
    // (CSS body:has(.products-page_filter-open) .base-footer), поэтому панель никого
    // не перекрывает и не требует скрытия/сжатия. Небольшой отступ снизу (4px) —
    // панель не «прилипает» к краю и не упирается в системную зону жестов.
    height: calc(100dvh - var(--crumb-h, 0px) - toRem(4));
    overflow: hidden; // для анимации ширины (сам скролл — у диалога)
    background-color: var(--bg);
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
    // Полосу скролла убираем (индикатор прокрутки — шеврон внизу)
    scrollbar-width: none;
    // Скролл фильтров не «пробрасывается» на страницу: пока в панели есть что
    // скроллить — страница стоит; дошёл до края — страница не уезжает сразу.
    overscroll-behavior: contain;

    // Внутренний боковой паддинг панели (просьба: 4px)
    @media (max-width: $mobile) {
      padding-inline: toRem(4);
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

  // Первая секция («Все категории») на mobile: тот же отступ сверху (24px), что и
  // между секциями после «втиснутого» разделителя (шапка панели даёт такой же бордер).
  &__section:first-of-type {
    @media (max-width: $mobile) {
      padding-block-start: toRem(24);
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
      // min-height:0 обязателен: без него grid-ряд 0fr не схлопывается ниже
      // min-content ребёнка (высокие элементы — поля цены и т.п. — торчали бы
      // из закрытой секции).
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
    position: relative;
    display: flex;
    align-items: center;
    gap: toRem(6);

    // Точку радио скрываем — вместо неё иконка категории. input остаётся в DOM
    // (фокус/a11y), но не занимает места и невидим; фокус показываем на строке.
    :deep(.u-input__radio) {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
    }

    // UInput radio внутри строки: имя занимает свободное место, счётчик справа.
    // min-width:0 обязателен: без него flex-элемент не сжимается ниже min-content
    // (самое длинное слово) → строка шире панели → счётчик обрезался.
    :deep(.u-input) {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    // Подпись категории: toEm считается от размера body (adaptiveValue ≈14px на
    // мобильном), поэтому 2-й аргумент 14 → на 390px получается ≈15px (было 13.24px).
    :deep(.u-input__radio-label) {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
      font-size: toEm(15, 14);
      transition: color var(--transition-duration);
    }

    // Фокус с клавиатуры — на строке (точка скрыта)
    &:focus-within {
      outline: toRem(2) solid var(--warning-color);
      outline-offset: toRem(2);
      border-radius: toRem(4);
    }

    // Активная категория: иконка СОХРАНЯЕТ свой цвет (задан inline), но чуть толще;
    // текст жирнее; галочка и счётчик — зелёные.
    &_is-active {
      // Иконка чуть толще и на 1px больше
      .shop-filters__category-icon {
        stroke: currentColor;
        stroke-width: 0.8;
        width: toRem(19);
        height: toRem(19);
      }

      :deep(.u-input__radio-label) {
        font-weight: 600;
      }

      // Жирнее и цветом текста — ТОЛЬКО у активного счётчика
      .shop-filters__category-count {
        font-weight: 600;
        color: var(--color);
      }
    }
  }

  // Иконка категории (вместо точки радио)
  &__category-icon {
    width: toRem(18);
    height: toRem(18);
    flex-shrink: 0;
    color: var(--gray-color);
    transition: color var(--transition-duration);
  }

  // Галочка активной категории — сразу после названия, ПЕРЕД счётчиком (в потоке).
  // Жёлтая, чуть «жирнее» за счёт обводки.
  &__category-check {
    width: toRem(16);
    height: toRem(16);
    flex-shrink: 0;
    color: var(--yellow-color);
    stroke: currentColor;
    stroke-width: 0.6;
    pointer-events: none;
  }

  &__category-count {
    flex-shrink: 0; // счётчик не сжимаем — иначе режется
    font-size: toEm(14);
    color: var(--gray-color);
  }

  // ==== Цена: пресеты-чипы + поля «своего диапазона» ====
  // Чипы-диапазоны (5)
  &__price-presets {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: toRem(8);

    li {
      display: flex;
    }
  }

  &__price-preset {
    padding: toRem(7) toRem(12);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(20);
    background: var(--whitesmoke-color);
    color: var(--gray-color);
    font-size: toEm(13);
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--transition-duration),
      border-color var(--transition-duration),
      color var(--transition-duration);

    &_is-active {
      background: var(--green-color);
      border-color: var(--green-color);
      color: var(--light-color);
    }

    @include hover {
      border-color: var(--success-color);
    }
  }

  // Подпись над полями «своего диапазона» — смысловой разделитель с чипами
  &__price-custom {
    margin: toRem(12) 0 toRem(4);
    font-size: toEm(13);
    color: var(--gray-color);
  }

  // Свой диапазон — числовые поля (альтернатива пресетам)
  &__price-values {
    display: flex;
    align-items: center;
    justify-content: center; // группа полей — по центру
    gap: toRem(8);
    font-size: toEm(15);
    color: var(--color);
  }

  // Инпуты «своего диапазона»: ещё +8px по высоте, крупнее скругление, фокус
  &__price-value-input {
    flex: 1 1 0;
    max-width: toRem(80);
    min-width: 0;
    padding: toEm(10) toEm(8);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(8);
    color: var(--color);
    background-color: var(--bg);
    text-align: center;
    font-size: toEm(14);
    transition:
      border-color var(--transition-duration),
      box-shadow var(--transition-duration);

    &:focus-visible {
      outline: none;
      border-color: var(--yellow-color);
      box-shadow: 0 0 0 toRem(2) color-mix(in srgb, var(--yellow-color) 35%, transparent);
    }

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

  // Кнопка-шеврон прокрутки панели: sticky внизу диалога, по центру. Показывается
  // через UScrollNav (mode="toggle") — только пока контент не помещается целиком.
  // Кнопка-шеврон прокрутки: ПРЯМОУГОЛЬНАЯ — вокруг иконки тонкий бордер;
  // тень широкая через box-shadow со spread (внешняя тень рисуется и без фона,
  // по рамке). Прижата к самому низу панели.
  &__scroll-nav {
    position: sticky;
    bottom: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    width: toRem(34);
    height: toRem(34);
    margin-inline: auto;
    padding: 0;
    background: none;
    color: var(--yellow-color);
    border: toRem(1) solid var(--border-color);
    border-radius: 0;
    cursor: pointer;
    // Широкая тень: большой размыв + spread
    box-shadow: 0 toRem(4) toRem(24) toRem(8) rgba(0, 0, 0, 0.28);
    transition:
      box-shadow var(--transition-duration),
      transform var(--transition-duration);

    svg {
      width: toRem(20);
      height: toRem(20);
    }

    @include hover {
      transform: scale(1.08);
      box-shadow: 0 toRem(6) toRem(30) toRem(10) rgba(0, 0, 0, 0.35);
    }
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
    // Небольшой нижний отступ контента (был 30px — под баннером оставалась пустота).
    padding-block-end: toRem(12);

    &__tags {
      gap: toRem(6);
    }

    &__banner {
      min-height: toRem(100);
      padding: toRem(18) toRem(16);
      // Баннер — последний блок на mobile (sale-section скрыта): убираем его
      // margin-bottom (24px), чтобы снизу не было двойного отступа.
      margin-block-end: 0;
    }
  }
}

// ===== Шапка панели (mobile): сортировка + закрытие =====
// Скрыта на desktop (там сортировка/кнопка в тулбаре страницы). Sticky — всегда видна
// при внутреннем скролле списка фильтров.
.shop-filters__header {
  display: none;

  @media (max-width: $mobile) {
    // Не липкая: шапка панели прокручивается вместе с содержимым фильтров
    display: flex;
    align-items: center;
    gap: toRem(10);
    padding: toRem(10) 0 toRem(24);
    // Тот же «втиснутый» разделитель, что у секций фильтров ниже — единый вид
    border-bottom: toRem(1) solid rgba(0, 0, 0, 0.3);
    box-shadow:
      inset 0 toRem(-1) 0 rgba(0, 0, 0, 0.08),
      0 toRem(1) 0 rgba(255, 255, 255, 0.6);

    // Кнопка закрытия (тёмный фон «как фоновое изображение», белый крестик).
    // :deep(path) — у path нет scoped-атрибута (внутри дочернего Icon).
    .shop-filters__close {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      height: toRem(30);
      padding: 0 toRem(10.5); // ширина на 2px меньше (было 11.5)
      background-color: var(--color);
      color: var(--light-color);
      border: toRem(1) solid var(--border-color);
      border-radius: toRem(6);
      cursor: pointer;

      svg {
        color: var(--light-color);
        width: toRem(22);
        height: toRem(22);
        flex-shrink: 0;

        // «+1px» толщина (иконка штриховая, stroke-width=2 → 3)
        :deep(path) {
          stroke-width: 3;
        }
      }

      // Анимация filter ↔ close (тот же Transition, что у тулбара/плавашки)
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

    .shop-filters__sort {
      // Селект — справа (кнопка закрытия слева)
      margin-inline-start: auto;
      width: fit-content;
      flex: 0 1 auto;
      min-width: 0;
    }
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
