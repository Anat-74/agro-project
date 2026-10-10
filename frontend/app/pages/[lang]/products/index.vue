<script setup lang="ts">
import { shopFiltersTranslations } from '~/locales/shopFilters'
import { productFilterTranslations } from '~/locales/productFilter'
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
import ShowShopFilter from '~/components/show-modal/ShowShopFilter.vue'

const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();
const t = computed(() => shopFiltersTranslations[currentLocale.value])
const pf = computed(() => productFilterTranslations[currentLocale.value])
const vh = computed(() => visuallyHiddenTranslations[currentLocale.value])

const shopFilterRef = useTemplateRef<InstanceType<typeof ShowShopFilter>>("shopFilter")

// Глобальное состояние диалога фильтров — нужно классу на странице
// (products-page_filter-open: раскладка «панель + карточки» и одна колонка карточек).
const { isOpen: filterDialogOpen } = useDialog("shopFilterDialog")

// Высота липких крошек при открытом фильтре (постоянная, пока фильтр открыт) — от неё
// считаем отступ/высоту fixed-панели фильтров.
useMeasureToVar("--crumb-h", {
  enabled: () => filterDialogOpen.value,
  active: filterDialogOpen,
  observe: () => document.querySelector(".products-page__header"),
  measure: () => {
    const el = document.querySelector<HTMLElement>(".products-page__header")
    return el ? `${el.offsetHeight}px` : null
  },
})

// Подвал при открытом фильтре (mobile) скрывается через CSS
// (body:has(.products-page_filter-open) .base-footer — см. _globals.scss),
// поэтому панель фильтров фиксированной высоты никого не перекрывает.

// При уходе со страницы (например, клик «Главное» в breadcrumbs) закрываем диалог:
// иначе isOpen остаётся true (глобальный Map).
onBeforeRouteLeave(() => {
  shopFilterRef.value?.close?.()
})

// ===== Состояние фильтров (сайдбар + сортировка) — единый источник: URL =====
const router = useRouter();
const {
  category,
  sort,
  priceMin,
  priceMax,
  tags,
  page,
} = useProductsFilters(route, router);

// ===== Хлебные крошки: фон из global.breadcrumbs (background.background-image) =====
const { data: globalData } = useCachedAsyncData(
  `shop-global-breadcrumbs-${currentLocale.value}`,
  () => find("global", {
    filters: { locale: { $eq: currentLocale.value } },
    fields: ["id"],
    populate: {
      breadcrumbs: {
        populate: {
          background: {
            populate: {
              baseBgImageWebp: { fields: ["url"] },
              retinaBgImageAvif: { fields: ["url"] },
            },
          },
        },
      },
    },
  } as any),
  { ttl: 600_000 },
)

const breadcrumbsBackground = computed(() => {
  // global — single type: Content API возвращает data как объект (не массив)
  const g = globalData.value?.data as any
  const bc = Array.isArray(g) ? g[0]?.breadcrumbs : g?.breadcrumbs
  return bc?.background ?? null
})

// ===== Товары: все продукты с фильтрами/сортировкой/пагинацией =====
const PAGE_SIZE = 12;

const productsKey = () =>
  `shop-products-${currentLocale.value}-${category.value}-${sort.value}-${priceMin.value}-${priceMax.value}-${tags.value.join(",")}-${page.value}`

const { data: productsData, status } = useCachedAsyncData(
  productsKey,
  async () => {
    const filters: any = { locale: { $eq: currentLocale.value } }
    // Товар может лежать напрямую в категории (category) или в её подкатегории
    // (subcategory.category при category=null) — ищем по обоим путям
    if (category.value) {
      filters.$or = [
        { category: { slug: { $eq: category.value } } },
        { subcategory: { category: { slug: { $eq: category.value } } } },
      ]
    }
    if (priceMin.value > 0 || priceMax.value < 2000) {
      filters.price = {}
      if (priceMin.value > 0) filters.price.$gte = priceMin.value
      if (priceMax.value < 2000) filters.price.$lte = priceMax.value
    }
    return find("products", {
      filters,
      populate: { image: { fields: ["alternativeText", "url"] } },
      sort: [sort.value],
      pagination: { page: page.value, pageSize: PAGE_SIZE },
    } as any) as Promise<ProductsResponse>
  },
  { ttl: 600_000 },
)

const products = computed(() => productsData.value?.data ?? [])
const pageCount = computed(() => productsData.value?.meta?.pagination?.pageCount || 1)
const resultsCount = computed(() => productsData.value?.meta?.pagination?.total ?? 0)

// Лоадер только когда ДАННЫХ ещё нет (первая загрузка): при повторных запросах
// (смена фильтра/страницы) старые данные остаются — контент не «мигает».
const isLoading = computed(
  () => (status.value === "idle" || status.value === "pending") && !products.value.length,
)

// Смена фильтров/сортировки/пагинации (включая сброс page=1) уже обрабатывается
// в useProductsFilters (единый источник — URL, router.replace). Здесь остаётся
// только O2-открытие панели после успешной загрузки.

// O2 (plan.md §1): панель фильтров на desktop открывается ПОСЛЕ загрузки товаров
// (status === 'success') — при входе и на SSR панель закрыта, поэтому нет «флипа»
// контента (mobile больше не «закрывает диалог после маунта»). Открываем ОДИН раз.
const { width } = useViewport()
let filterDialogOpened = false
const openFilterDialogOnce = () => {
  if (filterDialogOpened || !import.meta.client) return
  if (status.value === "success" && width.value > 767.98 && shopFilterRef.value) {
    filterDialogOpened = true
    shopFilterRef.value.open?.()
  }
}
onMounted(openFilterDialogOnce)
watch(status, openFilterDialogOnce)

// SEO — страница «все товары» не имеет контент-типа в Strapi, поэтому мета
// статическая локализованная (паттерн подкатегории адаптирован). ogImage — фон
// breadcrumbs из Strapi. StructuredData не добавляем (нет источника данных).
const config = useRuntimeConfig();

const seoTitle = computed(() => t.value.seoTitle)
const seoDescription = computed(() => t.value.seoDescription)
const seoImage = computed(() => {
  const webp = breadcrumbsBackground.value?.baseBgImageWebp?.url
  const avif = breadcrumbsBackground.value?.retinaBgImageAvif?.url
  const url = webp || avif
  return url ? `${config.public.strapi.url}${url}` : null
})

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: seoImage,
  ogUrl: computed(() => `${config.public.siteUrl}${route.fullPath}`),
});
</script>

<template>
  <section
    :class="['products-page', { 'products-page_filter-open': filterDialogOpen }]"
    aria-labelledby="products-page-title"
  >
    <!-- Скрытый H1: на странице нет видимого главного заголовка,
         но у section обязан быть заголовок (паттерн страниц каталога) -->
    <h1 id="products-page-title" class="visually-hidden">
      {{ t.seoTitle }}
    </h1>

    <!-- Шапка страницы: хлебные крошки (вне контейнера) + панель фильтра/сортировки -->
    <header class="products-page__header" :aria-label="vh.productsPageHeader">
      <UBreadcrumbs
        :items="[{ label: t.breadcrumbsCurrent }]"
        :background="breadcrumbsBackground"
      />

      <!-- Панель (бывший top-bar): имя __container даёт автоматический констрейнт
           1420 (конвенция _utils.scss [class*="__container"]). Элементы — сразу,
           без лишних обёрток -->
      <div class="products-page__container-top">
        <UButton
          :class="[
            'products-page__filter-btn',
            { 'products-page__filter-btn_is-open': shopFilterRef?.isOpen },
          ]"
          variant="plain"
          :aria-label="t.filterTitle"
          :aria-expanded="shopFilterRef?.isOpen"
          aria-controls="dialogShopFilter"
          @click="shopFilterRef?.toggle()"
        >
          <span class="products-page__filter-icon">
            <Transition name="filter-icon" mode="out-in">
              <Icon
                v-if="shopFilterRef?.isOpen"
                key="close"
                name="mingcute:close-line"
              />
              <Icon v-else key="filter" name="mingcute:filter-line" />
            </Transition>
          </span>
          <span>{{ t.filterTitle }}</span>
        </UButton>
        <USelect
          v-model="sort"
          class="products-page__select"
          :label="t.sortLabel"
          :options="[
            { value: 'name:asc', label: pf.optionName },
            { value: 'price:asc', label: pf.optionPrice },
            { value: 'price:desc', label: pf.optionPriceDesc },
          ]"
        />
        <span class="products-page__results">
          {{ t.resultsCount.replace("{count}", String(resultsCount)) }}
        </span>
      </div>
    </header>

    <!-- Контент-зона: имя __container даёт констрейнт 1420 + центрирование (desktop).
         Внутри flex-раскладка: сайдбар фильтров + карточки -->
    <div class="products-page__container-body">
      <!-- Сайдбар фильтров: диалог изначально открыт, кнопка «Фильтр» в панели -->
      <ShowShopFilter
        ref="shopFilter"
        :category="category"
        :price-min="priceMin"
        :price-max="priceMax"
        :tags="tags"
        :sort="sort"
        @update:category="category = $event"
        @update:price-min="priceMin = $event"
        @update:price-max="priceMax = $event"
        @update:tags="tags = $event"
        @update:sort="sort = $event"
      />

      <!-- Лоадер — самопозиционирующийся (fixed, центр вьюпорта): ставим просто
           в разметке, родительских стилей не нужно -->
      <ULoader v-show="isLoading" />

      <!-- Список карточек: flex:1 (колонка результатов) + grid + контейнер cards.
           aria-label именует список -->
      <ul
        v-if="products.length"
        class="products-page__card-list"
        :aria-label="vh.productsListLabel"
      >
        <ProductCard
          v-for="(prod, index) in products"
          :key="prod.documentId"
          :product="prod"
          :index="index"
        />
      </ul>

      <!-- Пусто — <span> с display:block: короткое сообщение без сильной смысловой
           нагрузки (не параграф прозы); div не используем (для нас div = wrapper) -->
      <span v-else-if="status === 'success'" class="products-page__empty">
        {{ t.noResults }}
      </span>

      <!-- Пагинация — вне потока (absolute), у низа контент-зоны: последний элемент
           удобно позиционировать; якорь — container-body (position: relative) -->
      <UPagination
        v-if="pageCount > 1"
        class="products-page__pagination"
        :page="page"
        :page-count="pageCount"
        :route-name="route.name?.toString() || ''"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.products-page {
  // Открытие/закрытие фильтра меняет число колонок карточек (2↔1) → браузерный
  // scroll-anchoring «дёргает» позицию скролла. Отключаем якорение на странице.
  overflow-anchor: none;

  // Mobile: flex-колонка ВСЕГДА (при закрытом диалоге auto-высота = обычный поток).
  // display:flex не «перещёлкивается» при открытии. Высота страницы НЕ анимируется
  // (кламп мгновенный): анимация height + height шапки вместе давали overshoot —
  // верх диалога уезжал выше (y=98), потом «отскакивал» в y=119.
  @media (max-width: $mobile) {
    display: flex;
    flex-direction: column;

    // Шапка страницы (крошки + панель) — auto-высота
    .products-page__header {
      flex-shrink: 0;
    }

    // Контент (container-body) — занимает оставшееся место (flex:1). Авто-маржу
    // глобального [class*="__container"] нейтрализуем: на mobile это flex-ребёнок
    // колонки — авто-маржа схлопнула бы его (вьюпорт < 1420, центрировать нечего)
    .products-page__container-body {
      flex: 1;
      min-height: 0;
      margin-inline: 0;
    }
  }

  // (mobile) Ничего не сдвигаем: шапку сайта при открытом фильтре прячем схлопыванием
  // (см. AppHeader → display:none), поэтому «дыры» нет и компенсация не нужна.
  // Это позволяет панели фильтров быть position: fixed вне transform-предка.

  &__header {
    // Крошки + панель. Sticky-эксперимент (mobile): продуктовый header липнет ПОД
    // шапкой сайта (её прилипший низ ~125px на 390×800), контент скролится под ним.
    // Фон — фон страницы, чтобы контент не просвечивал в зазорах между блоками.
    @media (max-width: $mobile) {
      // position: sticky;
      // top: toRem(125);
      z-index: 10;
      background-color: var(--bg);
    }
  }

  &__container-body {
    display: flex;
    gap: toRem(30);
    // Дети держат натуральную высоту: карточки (flex:1) не «надуваются» под
    // длинный список фильтров. Кап/скролл сайдбара — внутри ShowShopFilter.
    align-items: flex-start;
    // Якорь для пагинации (absolute)
    position: relative;
    // Имя __container → глобальный [class*="__container"]: max-width 1420 + центр
    // + боковые паддинги.
    // mobile (вариант 2): остаётся flex-row — панель фильтров слева, карточки справа.
    @media (max-width: $mobile) {
      // Узкий экран: уменьшаем зазор, чтобы правой колонке хватило на карточку
      gap: toRem(10);
    }
  }

  &__card-list {
    // Колонка результатов в flex-зоне (desktop: после сайдбара; mobile: во всю ширину)
    flex: 1;
    min-width: 0;
    display: grid;
    justify-items: center;
    row-gap: toEm(24);
    @include gridCards(fit, toRem(180), 1fr);
    @include adaptiveValue("column-gap", 40, 5);
    // Контейнер cards — НА самом списке. Ширина ul задаётся родителем (flex/block),
    // поэтому container-type не схлопывает его (в отличие от flex-ленты Featured).
    // auto-fit с min 180px на узкой зоне (<2×180) дал бы 1 колонку — 2 колонки
    // на телефонах задаёт медиа-запрос ниже (self-query на ul невозможен).
    @include containerParent(cards, inline-size);
    // Запас под флоатящую пагинацию (absolute) — она не занимает место в потоке,
    // поэтому последний ряд карточек не должен ложиться под неё
    padding-block-end: toRem(64);
    // В узкой колонке (mobile при открытом фильтре) у карточки есть служебный
    // grid-вариант контента, выступающий на несколько px → горизонтальный скролл.
    // Клип по X убирает его, не трогая видимый контент.
    overflow-x: clip;
  }

  &__pagination {
    // Пагинация ВНЕ потока (absolute, якорь — container-body). Прижата к правому
    // нижнему краю зоны с отступами: 12px от низа, 8px от правого края.
    position: absolute;
    bottom: toRem(12);
    right: toRem(8);
  }

  &__empty {
    // Состояние «ничего не найдено» — занимает колонку результатов (как ul).
    // span + display:block: лёгкое сообщение без смысловой нагрузки (не div/не p)
    flex: 1;
    min-width: 0;
    display: block;
    text-align: center;
    padding-block: toEm(40);
    font-size: toEm(18);
    color: var(--gray-color);

    // Desktop (flex-row): не растягиваться по высоте под сайдбар
    // (на mobile колонка сама даёт полную ширину)
    @media (min-width: $mobile) {
      align-self: flex-start;
    }
  }
}

// Телефоны: 2 карточки в ряд. Медиа-запрос вместо @container cards — контейнер
// теперь на самом ul, а ul не может стилизовать сам себя (self-query не работает).
// На широком блоке 2+ колонки даёт сам auto-fit (gridCards fit, min 180px).
@media (max-width: $mobileSmall) {
  // Две карточки в ряд — только когда фильтр закрыт: при открытом панель слева
  // сужает правую колонку, и там одна карточка (видна целиком).
  .products-page:not(.products-page_filter-open) .products-page__card-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: $mobile) {
  // При открытом фильтре тулбар страницы скрыт: его контролы (кнопка закрытия + селект)
  // теперь в шапке панели фильтров. Крошки — обычные (скроллятся со страницей).
  .products-page_filter-open .products-page__container-top {
    display: none;
  }

  // Крошки липнут к самому верху при открытом фильтре (шапка сайта схлопнута → сдвига нет).
  .products-page_filter-open .products-page__header {
    position: sticky;
    top: 0;
    z-index: 20;
  }

  // Убираем нижний отступ крошек (22px) — контент начинается сразу под ними
  .products-page_filter-open .breadcrumbs {
    margin-block-end: 0;
  }

  // Панель фильтров — position: fixed (вне потока, слева). Товарную колонку сдвигаем
  // вправо на ширину панели + зазор (12 — контейнерный padding на mobile).
  .products-page_filter-open .products-page__container-body {
    padding-inline-start: calc(
      toRem(12) + var(--filter-drawer-w, 0px) + toRem(10)
    );
  }

  // Товарная колонка при открытом фильтре — одна колонка (карточка по ширине колонки).
  // padding-block-end = 0: пагинация при открытом фильтре лежит НИЖЕ контейнера
  // (её резерв под «плавающую» пагинацию не нужен) → пустоты перед ней нет.
  .products-page_filter-open .products-page__card-list {
    grid-template-columns: 1fr;
    padding-block-end: 0;
  }

  // Выравниваем пагинацию с низом панели фильтров: внизу страницы под товарной зоной
  // есть запас (~62px), поэтому пагинация «выше» панели. Сдвигаем её ниже на этот запас,
  // чтобы внизу страницы низ пагинации совпал с низом панели (панель — screen − 9px).
  .products-page_filter-open .products-page__pagination {
    bottom: toRem(-53);
  }
}

// ===== Хлебные крошки =====
// (стили вынесены в переиспользуемый компонент Breadcrumbs.vue)

// ===== Панель фильтра/сортировки (бывший top-bar) =====
// Элементы плоские (BEM, один уровень). __container-top — имя содержит __container,
// поэтому _utils.scss [class*="__container"] автоматически даёт констрейнт 1420 +
// центрирование + паддинги. Обёртки убраны: select прижат вправо через
// margin-inline-start:auto (без __right/__left/__sort).
.products-page {
  &__container-top {
    display: flex;
    align-items: center;
    gap: toRem(24);
    flex-wrap: wrap;
    // B2 — панель-подложка: мягкий фон объединяет три контроля (бордеры по краям
    // идут от глобального [class*="__container"] → боковые паддинги контейнера)
    background-color: var(--bg-product);
    border-radius: toRem(12);
    padding-block: toRem(10);
    margin-block-end: toRem(24);
    // Выше mobile-оверлея фильтров (ShowShopFilter position:absolute z-index:9999) —
    // кнопка «Фильтр» остаётся доступной при открытом полноэкранном окне
    position: relative;
    z-index: 6;

    // ==== Адаптив ====
    @media (max-width: $mobile) {
      // Отступ от панели до диалога фильтров — 10px (было 24px)
      margin-block-end: toRem(10);
      // Отступы ужаты (24→8), иначе на 375px строка не влезает в контейнер
      gap: toRem(8);
      padding-block: toRem(8);
    }
  }

  &__filter-btn {
    display: inline-flex;
    align-items: center;
    gap: toRem(8);
    // Зелёный фон + светлый текст/иконка (кнопка открытия диалога);
    // при открытом окне — danger-цвет (см. &_is-open)
    background-color: var(--green-color);
    color: var(--light-color);
    // A — единый «хром» с select/results: одинаковая рамка и радиус
    border: toRem(1) solid var(--border-color);
    cursor: pointer;
    // Высота = высоте select (30px), вертикальные паддинги убраны
    height: toRem(30);
    box-sizing: border-box;
    padding: 0 toRem(12);
    border-radius: toRem(6);
    font-size: toEm(16);
    font-weight: 500;
    transition: background-color var(--transition-duration);

    svg {
      color: var(--light-color);
      flex-shrink: 0;
      width: toRem(20);
      height: toRem(20);
    }

    // Окно фильтров открыто → danger-цвет
    &_is-open {
      background-color: var(--danger-color);

      @include hover {
        background-color: color-mix(in srgb, var(--danger-color) 85%, var(--dark-color));
      }
    }

    &:not(&_is-open) {
      @include hover {
        // Тёмно-зелёный при наведении (colorMix от зелёного к тёмному)
        background-color: color-mix(in srgb, var(--green-color) 85%, var(--dark-color));
      }
    }

    @media (max-width: $mobile) {
      font-size: toEm(15);
    }
  }

  // Плавная смена иконки (filter ↔ close) — crossfade + поворот
  &__filter-icon {
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

  // Select: прижат вправо (margin-inline-start:auto — замена обёртки __right),
  // shrink разрешён (flex: 0 1 auto); шрифт стандартный; без inset-тени.
  // Короткие подписи («А --> Я» и т.п.) — ширина меньше прежней.
  &__select {
    flex: 0 1 auto;
    min-width: 0;
    margin-inline-start: auto;

    :deep(.select) {
      width: toEm(120);
      font-family: inherit;
      box-shadow: none;
    }

    @media (max-width: $mobile) {
      :deep(.select) {
        width: toRem(120);
        max-width: 100%;
      }
    }
  }

  &__results {
    // Высота = высоте select (30px). A — единый «хром»: та же рамка и радиус,
    // что у select/кнопки; эффект «втиснения»/inset убран
    display: inline-flex;
    align-items: center;
    height: toRem(30);
    box-sizing: border-box;
    font-size: toEm(14);
    color: var(--gray-color);
    white-space: nowrap;
    padding-inline: toRem(10);
    border-radius: toRem(6);
    border: toRem(1) solid var(--border-color);
    background-color: var(--light-color);

    @media (max-width: $mobile) {
      text-align: end;
      font-size: toEm(13);
    }
  }
}
</style>
