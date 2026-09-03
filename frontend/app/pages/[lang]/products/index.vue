<script setup lang="ts">
import { shopFiltersTranslations } from '~/locales/shopFilters'
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
import ShowShopFilter from '~/components/show-modal/ShowShopFilter.vue'

const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();
const t = computed(() => shopFiltersTranslations[currentLocale.value])
const vh = computed(() => visuallyHiddenTranslations[currentLocale.value])

const shopFilterRef = useTemplateRef<InstanceType<typeof ShowShopFilter>>("shopFilter")

// Глобальное состояние диалога фильтров — для класса на странице (как в AppHeader/
// BackgroundPopover). Template ref (shopFilterRef) нужен только кнопке: toggle/aria.
const { isOpen: filterDialogOpen } = useDialog("shopFilterDialog")

// При уходе со страницы (например, клик «Главное» в breadcrumbs) закрываем диалог:
// иначе isOpen остаётся true (глобальный Map) и шапка на главной скрыта.
// close берём из template ref: id-only useDialog возвращает только isOpen.
onBeforeRouteLeave(() => {
  shopFilterRef.value?.close?.()
})

// JS-вариант анимации (plan.md §3): при ОТКРЫТИИ фильтра меряем фактическую
// высоту глобальной шапки (.header, offsetHeight — реальный layout, без margin,
// не учитывает transform) и кладём её в CSS-переменную --header-h на :root.
// .products-page поднимается на эту высоту transform'ом (GPU), шапка уезжает
// translateY(-100%) — движение без layout-переходов (плавно на телефоне).
watch(
  filterDialogOpen,
  (open) => {
    // document есть только на клиенте (SSR-рендер без него)
    if (!import.meta.client) return
    const header = document.querySelector<HTMLElement>(".header")
    if (!header) return
    // setProperty до того, как класс products-page_filter-open применится
    // в render (flush 'pre' — до обновления компонента)
    document.documentElement.style.setProperty(
      "--header-h",
      `${open ? header.offsetHeight : 0}px`,
    )
  },
  { immediate: true },
)

// ===== Состояние фильтров (сайдбар + сортировка) =====
const category = ref("");
const sort = ref("name:asc");
const priceMin = ref(0);
const priceMax = ref(2000);
const tags = ref<string[]>([]);

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
const page = ref(route.query.page ? +route.query.page : 1);
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

// Смена фильтров/сортировки — сброс на первую страницу. Сам запрос перезапускает
// РЕАКТИВНЫЙ КЛЮЧ productsKey (docs/nuxt-async-data.md §2) — refresh() не нужен.
watch([category, sort, priceMin, priceMax, tags], () => {
  page.value = 1
})

// Пагинация из query-параметра: смена page меняет ключ → авто-запрос
watch(
  () => route.query.page,
  (newPage) => {
    page.value = newPage ? +newPage : 1
  },
)

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
            { value: 'name:asc', label: t.sortName },
            { value: 'price:asc', label: t.sortPriceAsc },
            { value: 'price:desc', label: t.sortPriceDesc },
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
        @update:category="category = $event"
        @update:price-min="priceMin = $event"
        @update:price-max="priceMax = $event"
        @update:tags="tags = $event"
      />

      <!-- Лоадер — самопозиционирующийся (fixed, центр вьюпорта): ставим просто
           в разметке, родительских стилей не нужно -->
      <ULoader v-show="isLoading" />

      <!-- Список карточек: flex:1 (колонка результатов) + grid + контейнер cards.
           aria-label именует список (обёртка __content удалена) -->
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

  // Открытый диалог фильтров (mobile) — JS-вариант (plan.md §3):
  // страница ПОДНИМАЕТСЯ на высоту шапки через transform (GPU), а не через
  // layout (шапка тоже уезжает transform'ом). Ни одного height-перехода по
  // кадрам → без reflow/дёрганья. --header-h мерит JS (watcher на открытие).
  // Кламп height:100dvh — скролл-лок + размер оверлея (1 reflow в момент открытия).
  // transition живёт в БАЗОВОМ mobile-состоянии: анимируются и открытие, и закрытие
  @media (max-width: $mobile) {
    transition: transform var(--transition-duration-fast);

    &_filter-open {
      height: 100dvh;
      overflow: hidden;
      transform: translateY(calc(-1 * var(--header-h, 0px)));
    }
  }

  &__header {
    // Крошки + панель: констрейнт даёт вложенный __container (см. ниже)
  }

  &__container-body {
    display: flex;
    gap: toRem(30);
    align-items: stretch;
    // Якорь для mobile-оверлея сайдбара фильтров (ShowShopFilter position:absolute)
    position: relative;
    // Имя __container → глобальный [class*="__container"]: max-width 1420 + центр
    // + боковые паддинги. На desktop это БЛОК-ребёнок section → центрирование
    // работает. На mobile — flex-ребёнок колонки (margin-inline нейтрализован выше).

    @media (max-width: $mobile) {
      flex-direction: column;
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
  }

  &__pagination {
    // Пагинация ВНЕ потока (absolute, якорь — container-body). Прижата к правому
    // нижнему краю зоны: правый край зоны совпадает с правым краем колонки карточек
    // и в закрытом, и в открытом состоянии сайдбара (центровка по всей зоне
    // смещалась бы на ширину сайдбара).
    position: absolute;
    bottom: 0;
    right: 0;
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
  .products-page__card-list {
    grid-template-columns: repeat(2, 1fr);
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
    padding-block-end: toRem(18);
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
    border: none;
    cursor: pointer;
    // Высота = высоте select (30px), вертикальные паддинги убраны
    height: toRem(30);
    box-sizing: border-box;
    padding: 0 toRem(12);
    border-radius: toRem(8);
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
  // shrink разрешён (flex: 0 1 auto); шрифт стандартный (не «Neucha» как у дефолта).
  // Эффект «углубления» (inset-тень) убран — перенесён на счётчик результатов.
  &__select {
    flex: 0 1 auto;
    min-width: 0;
    margin-inline-start: auto;

    :deep(.select) {
      width: toEm(141);
      font-family: inherit;
      box-shadow: none;
    }

    // На mobile USelect узкий (toEm(112)) — текст «Сначала дешевле» (118px) вылезал
    // за пределы (appearance: base-select). 139px = текст + паддинги + picker-icon
    @media (max-width: $mobile) {
      :deep(.select) {
        width: toRem(139);
        max-width: 100%;
      }
    }
  }

  &__results {
    // Высота = высоте select (30px), вертикальные паддинги убраны
    display: inline-flex;
    align-items: center;
    height: toRem(30);
    box-sizing: border-box;
    font-size: toEm(14);
    color: var(--gray-color);
    white-space: nowrap;
    // Чип-счётчик с эффектом «углубления» (раньше был у select): тёмная inset-тень
    // сверху + светлый блик снизу (вдавленный вид)
    padding-inline: toRem(6);
    border-radius: toRem(6);
    border: toRem(1) solid rgba(0, 0, 0, 0.25);
    box-shadow:
      inset 0 toRem(2) toRem(3) rgba(0, 0, 0, 0.25),
      0 toRem(1) 0 rgba(255, 255, 255, 0.4);
    background-color: var(--light-color);

    @media (max-width: $mobile) {
      text-align: end;
      font-size: toEm(13);
    }
  }
}
</style>
