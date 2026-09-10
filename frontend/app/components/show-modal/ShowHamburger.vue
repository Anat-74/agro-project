<script setup lang="ts">
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
import { discountProductTranslations } from "~/locales/discountProduct";
import { buttonTranslations } from "~/locales/button";
import { showHamburgerTranslations } from "~/locales/showHamburger";
import VoiceInput from "~/components/chat-assistant/VoiceInput.vue";

const visuallyHiddenT = computed(() => visuallyHiddenTranslations[currentLocale.value])
const discountT = computed(() => discountProductTranslations[currentLocale.value])
const buttonT = computed(() => buttonTranslations[currentLocale.value])
const showHamburgerT = computed(() => showHamburgerTranslations[currentLocale.value])

interface Props {
  footer: FooterData;
  socials: SocialLink[];
  phones: Phone[];
  global: any;
  // Утилита видимости (hidden-tablet / visible-tablet) — применяется на корень,
  // т.к. у fragment-компонента атрибуты из родителя не наследуются
  visibilityClass?: string;
  // Уникальный id диалога: desktop-инстанс «hamburgerCatalogDesktop»,
  // mobile-инстанс «hamburgerDialog». Разводит состояния двух инстансов —
  // иначе (один id) последний зарегистрированный элемент перехватывал
  // open()/close() у обоих (баг: desktop-кнопка открывала скрытый mobile-диалог).
  dialogId?: string;
}

const props = defineProps<Props>();

const dialogElement = useTemplateRef<HTMLDialogElement>("dialog-hamburger");

const { currentLocale } = useLocale();
const route = useRoute();

// Desktop-панель каталога открыта по умолчанию ТОЛЬКО на главной странице.
// На внутренних страницах она стартует закрытой: иначе панель (высота ~632px,
// z-index 9999) перекрывала верхний левый угол контента — например, на
// /ru/products кнопка «Фильтр» оказывалась ПОД панелью и её нельзя было нажать.
// Главная: путь "/" (дефолтная локаль, 0 сегментов) или "/{locale}" (1 сегмент).
const isHomePage = computed(() => route.path.split("/").filter(Boolean).length <= 1)

// Ключ состояния: desktop-панель каталога (hamburgerCatalogDesktop) открыта по
// умолчанию на главной, mobile-оверлей (hamburgerDialog) закрыт до тапа.
// Градации (HeroGrids, USocials) слушают hamburgerDialog — desktop-панель их
// не затемняет.
const dialogKey = computed(() => props.dialogId || "hamburgerDialog")
const isDesktopInstance = computed(() => dialogKey.value === "hamburgerCatalogDesktop")

const { open, close, isOpen, toggle } = useDialog(dialogKey.value, dialogElement, {
  useShowMethod: true,
  initialOpen: isDesktopInstance.value && isHomePage.value, // desktop: открыт на главной (SSR-стабильно)
})

// Состояние диалога глобально (useState) и переживает SPA-навигацию БЕЗ
// перемонтирования AppHeader, поэтому при смене маршрута синхронизируем вручную:
// на главной — панель открыта, на любой другой странице — закрыта.
// (Ранее блок «if (isDesktopInstance) isOpen = true» открывал панель на КАЖДОЙ
// странице — из-за этого фильтр на products был недоступен.)
watch(isHomePage, (home) => {
  if (!isDesktopInstance.value) return
  if (home) {
    if (!isOpen.value) open?.()
  } else if (isOpen.value) {
    close?.()
  }
}, { immediate: true })

// DOM-ид диалога уникален для каждого инстанса (в документе id не дублируются)
const dialogElementId = computed(() =>
  isDesktopInstance.value ? "dialog-hamburger-desktop" : "dialog-hamburger-mobile",
)

const { width } = useViewport()
// Телепорт — только на mobile (≤768). Выше (desktop) диалог в потоке/под кнопкой.
// Гейт на viewportReady: до onMounted (SSR и ПЕРВАЯ гидратация) isMobile === false,
// поэтому и сервер, и клиент рендерят диалог ОДИНАКОВО — в месте установки, без
// телепорта. Раньше isMobile считался от width=0 (0 ≤ 767 → true) ещё на сервере:
// SSR телепортил dialog в body, а на клиенте после реального замера ширины
// телепорт отключался → Vue гонял dialog туда-обратно (hydration mismatch
// «expected on client: dialog» + moveTeleport insertBefore на /ru/products).
// Теперь телепорт включается только ПОСЛЕ монтирования, когда ширина известна.
const viewportReady = ref(false)
onMounted(() => {
  viewportReady.value = true
})
const isMobile = computed(() => viewportReady.value && width.value <= 767.98)

// Desktop-панель на главной должна «упираться» в НИЗ полосы hero-grids
// (полоса висит внизу hero-секции и меняет высоту вместе со слайдером) —
// фиксированной высоты toEm(632) недостаточно. Замеряем расстояние от верха
// панели до низа полосы и пишем в --catalog-h (паттерн --header-h, products).
// На страницах без .hero-grids — CSS-фолбэк toEm(632) в свойстве height.
useMeasureToVar("--catalog-h", {
  enabled: () => isDesktopInstance.value,
  active: isOpen,
  observe: () => document.querySelector(".hero-slider"),
  measure: () => {
    const dlg = dialogElement.value
    const grids = document.querySelector(".hero-grids")
    if (!dlg || !grids) return null
    const dlgRect = dlg.getBoundingClientRect()
    if (dlgRect.height === 0) return null
    const bottom = grids.getBoundingClientRect().bottom
    return `${Math.max(0, Math.round(bottom - dlgRect.top))}px`
  },
})

const { getProductLink } = useProductLink();

// Поиск в шапке панели (планшет и ниже): переиспользуем общий стор поиска
// и оверлей результатов (как в шапке сайта), но поле — всегда на всю ширину.
const searchStore = useSearchStore();

// Голосовой ввод в поиске: распознанный текст кладём в стор и сразу ищем
const onVoiceSearch = (text: string) => {
  if (!text) return;
  searchStore.filters.name = text;
  searchStore.executeSearch();
};

// Активные ссылки аккордеона — по текущему маршруту
const isActive = (path: string) => route.path === path

const categoryKey = computed(() => `category-dialog-${currentLocale.value}`)

const {
  data: category,
  pending: pendingCategories,
  execute: executeCategory,
} = useCachedAsyncData(
  categoryKey,
  async () => {
    const { find } = useStrapi()
    const response = await find<Category>("categories", {
      filters: { locale: { $eq: currentLocale.value } },
      populate: {
        image: { fields: ["alternativeText", "url"] },
        subcategories: {
          fields: ["name", "slug"],
          // Изображение подкатегории — слева от названия (как у категорий/товаров)
          populate: {
            image: { fields: ["alternativeText", "url"] },
            // Товары подкатегории — вложенный <details> (план ShowHamburger 08.27):
            // подкатегория раскрывает СВОИ товары, переход — только по товару
            products: {
              fields: ["name", "slug"],
              populate: {
                image: { fields: ["alternativeText", "url"] },
                category: { fields: ["slug"] },
                subcategory: {
                  fields: ["slug"],
                  populate: { category: { fields: ["slug"] } },
                },
              },
            },
          },
        },
        products: {
          fields: ["name", "slug"],
          populate: {
            image: { fields: ["alternativeText", "url"] },
            category: { fields: ["slug"] },
            subcategory: {
              fields: ["slug"],
              populate: { category: { fields: ["slug"] } },
            },
          },
        },
      },
    } as any)
    return response.data || []
  },
  // SSR: каталог рендерится на сервере (SEO) — server: true (по умолчанию),
  // данные уходят в payload и гидратируются без повторного запроса
  { watch: [categoryKey], ttl: 600_000 }
)

// Акционные товары — общий кэш с корзиной (ShowModalCartDialog): один ключ,
// одинаковая форма данных (без fields-ограничения).
const productKey = computed(() => `cart-discount-${currentLocale.value}`)

const {
  data: product,
  pending: pendingProducts,
  execute: executeProduct,
  refresh: refreshProduct,
  error: productError,
} = useCachedAsyncData(
  productKey,
  async () => {
    const { find } = useStrapi()
    const response = await find<Product>("products", {
      filters: {
        isDiscount: true,
        locale: { $eq: currentLocale.value },
      },
      pagination: { pageSize: 100 } as PaginationMeta,
      populate: {
        image: { fields: ["alternativeText", "url"] },
        subcategory: {
          fields: ["name", "slug"],
          populate: { category: { fields: ["name", "slug"] } },
        },
      },
    } as any)
    return response.data || []
  },
  { watch: [productKey], server: false, ttl: 300_000 }
)

const pending = computed(
  () => pendingCategories.value || pendingProducts.value,
)

// Переключатель диалога из useDialog (открыт→закрыть, закрыт→открыть).
// При открытии дополнительно догружаем категории/товары (идемпотентно:
// execute* без повторного запроса, если данные уже загружены).
const toggleHamburger = () => {
  const wasOpen = isOpen.value
  toggle?.()
  if (!wasOpen) {
    if (!category.value) executeCategory()
    if (!product.value) executeProduct()
  }
}
</script>

<template>
  <!-- Единый корень: ShowHamburger — fragment, иначе Teleport диалога
       добавляет в grid container-bottom лишний элемент и ломает размещение каталога -->
  <div class="hamburger" :class="[props.visibilityClass, { hamburger_desktop: isDesktopInstance }]">
  <div :class="['hamburger-menu']">
    <UButton
      :is-open="isOpen"
      variant="hamburger"
      :aria-label="
        isOpen
           ? buttonT.ariaLabelDialogClosed
           : buttonT.ariaLabelDialogOpen
      "
      @click="toggleHamburger"
    />
    <span
      :class="[
        'hamburger-menu__categories',
        { 'hamburger-menu__categories_is-open': isOpen },
      ]"
      >{{ showHamburgerT.title }}
    </span>
  </div>
  <!-- Без ClientOnly: диалог рендерится в SSR (каталог индексируется).
       desktop-инстанс не телепортируется: на mobile его скрывает родитель
       (hidden-tablet → display:none), иначе после телепорта в body открытая
       панель каталога была бы видна на мобильном -->
  <Teleport to="body" :disabled="!isMobile || isDesktopInstance">
      <dialog
        :id="dialogElementId"
        ref="dialog-hamburger"
        class="dialog-hamburger"
        :open="isOpen"
        :aria-label="showHamburgerT.title"
      >
    <ULoader v-show="pending" />
    <h2 class="visually-hidden">
      {{ visuallyHiddenT.showModalMenuTitle }}
    </h2>
    <div class="dialog-hamburger__items">
      <!-- Шапка панели (планшет и ниже): поиск на всю ширину + голосовой ввод.
           Раньше здесь был блок __top (логотип + анимированный текст) — удалён. -->
      <header class="dialog-hamburger__header visible-tablet">
        <div class="dialog-hamburger__search">
          <ProductFilter variant="panel" class="dialog-hamburger__search-field" />
          <VoiceInput
            :disabled="false"
            :locale="currentLocale"
            @on-result="onVoiceSearch"
          />
        </div>
      </header>

      <ul v-if="category?.length" class="dialog-hamburger__accordion accordion">
         <li v-for="cat in category" :key="cat.documentId" class="accordion__item">
          
          <UAccordion name="faq" variant="default">
            <template #header>
              <UImage
                v-if="cat.image?.url"
                :src="cat.image?.url"
                alt=""
                class="accordion__product-image"
                width="44"
                height="32"
                type="icon"
              />
              <h3
                :class="[
                  'accordion__product-title',
                  {
                    'accordion__product-title_is-active': isActive(
                      `/${currentLocale}/${cat.slug}`,
                    ),
                  },
                ]"
              >
                {{ cat.name }}
              </h3>
            </template>
            <ul class="accordion__product-list">
                <!-- Подкатегория — вложенный <details>: клик раскрывает её товары,
                     НЕ переходит (план ShowHamburger 08.27). Своя группа name
                     'faq-%cat.slug%' (не общий 'faq'), иначе раскрытие подкатегории
                     закрывает родительскую категорию (нативная эксклюзивная группа). -->
                <li
                  v-for="sub in cat.subcategories"
                  :key="sub.documentId"
                  class="accordion__item"
                >
                <UAccordion
                  :name="`faq-${cat.slug}`"
                  variant="sub"
                  :active="isActive(`/${currentLocale}/${cat.slug}/${sub.slug}`)"
                >
                  <template #header>
                    <UImage
                      v-if="sub.image?.url"
                      :src="sub.image?.url"
                      alt=""
                      class="accordion__product-image"
                      width="44"
                      height="32"
                      type="icon"
                    />
                    <h4 class="accordion__product-sub-title">{{ sub.name }}</h4>
                  </template>
                  <ul class="accordion__product-list">
                      <li
                        v-for="subProd in sub.products"
                        :key="subProd.documentId"
                        class="accordion__product-item"
                      >
                        <NuxtLink
                          :class="[
                            'accordion__product-link',
                            {
                              'accordion__product-link_is-active': isActive(
                                getProductLink(subProd),
                              ),
                            },
                          ]"
                          :to="getProductLink(subProd)"
                          @click="close?.()"
                        >
                          <UImage
                            v-if="subProd.mainImage?.url || subProd.image?.length"
                            :src="subProd.mainImage?.url || subProd.image?.[0]?.url"
                            alt=""
                            class="accordion__product-image-link"
                            width="32"
                            height="32"
                            type="icon"
                          />
                          <h4 class="accordion__product-sub-title">{{ subProd.name }}</h4>
                        </NuxtLink>
                      </li>
                    </ul>
                </UAccordion>
                </li>
                <!-- Отображение продуктов, принадлежащих напрямую категории -->
                <li
                  v-for="prod in cat.products"
                  :key="prod.documentId"
                  class="accordion__product-item"
                >
                  <NuxtLink
                    :class="[
                      'accordion__product-link',
                      {
                        'accordion__product-link_is-active': isActive(
                          getProductLink(prod),
                        ),
                      },
                    ]"
                    :to="getProductLink(prod)"
                    @click="close?.()"
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
                    <h4 class="accordion__product-sub-title">{{ prod.name }}</h4>
                  </NuxtLink>
                </li>
              </ul>
          </UAccordion>
          </li>
        </ul>
      <div
        v-else-if="category && !category.length"
        class="dialog-hamburger__empty"
      >
        {{ showHamburgerT.emptyCategory }}
      </div>

      <div v-if="productError" class="dialog-hamburger__error">
        <p>{{ productError.message }}</p>
        <UButton variant="close" @click="() => refreshProduct()">
          {{ showHamburgerT.retry }}
        </UButton>
      </div>

      <div v-if="product?.length" class="accordion">
        
        <UAccordion name="faq" variant="discount">
          <template #header>
            <Icon
              class="accordion__discount-icon"
              name="mdi:discount-outline"
            />
            <h4 class="accordion__product-sub-title">
              {{ discountT.discount }}
            </h4>
          </template>
          <ul class="accordion__product-list">
            <li
              v-for="prod in product"
              :key="prod.documentId"
               class="accordion__product-item"
            >
              <NuxtLink
                :class="[
                  'accordion__product-link',
                  'accordion__product-link_is-discount',
                  { 'accordion__product-link_is-active': isActive(getProductLink(prod)) },
                ]"
                :to="getProductLink(prod)"
                @click="close?.()"
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
                <h4 class="accordion__product-sub-title">{{ prod.name }}</h4>
              </NuxtLink>
            </li>
          </ul>
        </UAccordion>
      </div>
      <div
        v-else-if="product && !product.length"
        class="dialog-hamburger__empty"
      >
        {{ showHamburgerT.emptyDiscount }}
      </div>

      <div class="dialog-hamburger__contacts">
        <div
          v-for="item in phones"
          :key="item.documentId || item.id"
           class="dialog-hamburger__phones"
        >
          <Icon v-if="item.isMobile" name="et:phone" />

          <Icon v-if="!item.isMobile" name="carbon:phone-ip" />
          <a
            :href="`tel:${item.phoneNumber.replace(/[^0-9+]/g, '')}`"
            class="company__link-phones"
            >{{ formatPhone(item.phoneNumber) }}
          </a>
        </div>
      </div>
    </div>

    <!-- Кнопка закрытия — позиционируется абсолютно (правый верхний угол диалога) -->
    <button
      type="button"
      class="dialog-hamburger__close visible-tablet"
      :aria-label="buttonT.ariaLabelDialogClosed"
      @click="close?.()"
    >
      <Icon name="mingcute:close-line" />
    </button>
    </dialog>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.hamburger {
  height: 100%;   // корень-обёртка — единый grid-элемент
  // Родитель для desktop-диалога (он не телепортируется): диалог позиционируется
  // absolute с top: calc(100% + 22px) — строго ПОД кнопкой (план.md §1.2).
  position: relative;
}

.hamburger-menu {
  // Якорь для диалога (desktop): панель позиционируется строго под кнопкой
  anchor-name: --hamburger-menu;
  // Стили самой кнопки (высота/радиус/цвет) — в UButton variant="hamburger"
  height: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  justify-items: center;
  align-items: center;
  border-left: toEm(9) solid var(--bg);
  border-right: toEm(9) solid var(--bg);
  background-color: var(--whitesmoke-color);
  border-radius: toRem(6);   // фон закруглён (все углы)
  // Единый источник ширины панели/кнопки — --catalog-width (styles.scss)
  width: var(--catalog-width);

  // Tablet и ниже: мобильный экземпляр (в DOM последним).
  // justify-self: end задаёт AppHeader (:deep) — раньше жил здесь и применялся поздно
  @media (max-width: $tablet) {
    height: 90%;
    width: toRem(150);
    direction: rtl;
    border-left: 0;
    border-right: 0;
  }

  &__categories {
    font-size: toEm(22);   // на 2px меньше (было 24)
    transition: color var(--transition-duration);

    &_is-open {
      color: var(--danger-color);
    }
  }
}

.dialog-hamburger {
  inset: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  z-index: 9999;
  height: 100dvh;
  width: 100dvw;
  translate: -100%;
  margin: 0;
  background-color: transparent;
  backdrop-filter: blur(22px);
  // display с задержкой: при закрытии панель видима на время exit-анимации
  // (translate/scale), затем display:none убирает её из accessibility-дерева
  // (иначе закрытый диалог остаётся в a11y-дереве)
  transition:
    translate var(--transition-duration),
    display 0s var(--transition-duration) allow-discrete;

  &:not([open]) {
    display: none;
  }

  // Мобильный каталог (≤$mobile): фикс от «прыжка вверх» (план №1).
  // Раньше диалог был в документном ПОТОКЕ (без position:fixed) — при show()
  // авто-фокус → scrollIntoView прокручивал документ к верху (scrollY 873→0),
  // т.к. элемент участвует в прокрутке и прячется через translate:-100%.
  // position:fixed выносит его из документной прокрутки — scrollIntoView к нему
  // становится no-op для документа. Как у ShowShopFilter (там fixed был всегда).
  @media (max-width: $mobile) {
    position: fixed;
  }

  @media (min-width:$mobile) {
    // Высота до НИЗА полосы hero-grids (--catalog-h, JS-замер, план.md §1.3).
    // Фолбэк toEm(632) — для страниц без .hero-grids (каталог открыт вне главной).
    height: var(--catalog-h, toEm(632));
    scale: 0;
    translate: 0;
    // Панель строго под кнопкой, без наложения на неё: .hamburger — position:relative,
    // диалог absolute, верх = низ обёртки кнопки + зазор 22px.
    // Раньше: position-anchor/position-area + inset:auto — inset:auto сбрасывал
    // вычисленные position-area инсеты, диалог оставался в static-position
    // (верх обёртки) + margin-block-start:22 → накрывал кнопку ~на половину
    // (низ кнопки 208px, верх диалога 167px). Проверено замером.
    position: absolute;
    // Сброс инсетов мобильной базы (inset: 0) — ОБЯЗАТЕЛЬНО до top/inset-inline:
    // shorthand inset, идущий после top, сбросил бы его в auto (top:auto →
    // диалог оставался в static-position и накрывал кнопку).
    inset: auto;
    // Горизонталь: desktop-инстанс — левый край по левому краю кнопки
    // (.hamburger_desktop ниже). mobile-инстанс на планшете (769–1023, кнопка
    // 150px справа) — раскрытие ВЛЕВО от кнопки (правый край по правому краю).
    inset-inline: 0 auto;
    // Вертикаль: низ обёртки кнопки + зазор 22px (после inset:auto!)
    top: calc(100% + toRem(22));
    margin: 0;
    border-radius: toEm(4);
    border-width: 0 toEm(3) toEm(3) toEm(3);
    border-style: solid;
    border-color: var(--border-color-transparent);
    width: var(--catalog-width);
    transition:
      scale 0.1s linear,
      display 0s var(--transition-duration) allow-discrete;
  }

  &[open] {
    translate: 0;
    transition: translate var(--transition-duration);

    @media (min-width: $mobile) {
      scale: 1;
      transition: scale 0.1s linear;
    }
  }

  // Tablet-инстанс (кнопка 150px справа в шапке): панель шире кнопки, её левый
  // край по inset-inline:0 вылез бы за правый край экрана — раскрываем влево.
  .hamburger:not(.hamburger_desktop) & {
    inset-inline: auto 0;
  }

  &__items {
    display: flex;
    flex-direction: column;
    row-gap: toEm(16);
    padding-inline: toEm(16);
    padding-block-start: toEm(22);
    padding-block-end: toEm(12);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--success-color) var(--whitesmoke-color);

    @media (max-width: $mobile) {
      justify-items: center;
      align-items: center;
      min-height: 100dvh;
      // @include adaptiveValue("padding-inline", 299, 12);
      // @include adaptiveValue("padding-block", 222, 32);
    }
  }

  // Шапка панели (планшет и ниже): поиск на всю ширину + голосовой ввод.
  // Пришла на место удалённого блока __top (логотип + анимированный текст).
  &__header {
    width: 100%;
  }

  &__search {
    display: flex;
    align-items: center;
    column-gap: toEm(8);
    width: 100%;

    // Поле поиска занимает всё доступное место, кнопка голоса — фиксированная
    &-field {
      flex: 1 1 auto;
      min-width: 0;
    }
  }

  // Кнопка закрытия — правый верхний угол диалога (вместо удалённого сайдбара)
  &__close {
    position: absolute;
    top: toRem(10);
    right: toRem(10);
    z-index: 10;
    display: grid;
    place-items: center;
    width: toRem(40);
    height: toRem(40);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 toRem(2) toRem(10) rgba(0, 0, 0, 0.15);
    color: var(--color);
    cursor: pointer;
    transition: background var(--transition-duration), scale var(--transition-duration);

    svg {
      font-size: toRem(22);
    }

    @include hover {
      background: var(--bg-secondary);
      scale: 1.06;
    }
  }

  &__accordion {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    row-gap: toEm(16);

    @media (min-width: $mobile) {
      justify-content: start;
      padding-block-end: toRem(22);
    }

    @media ($mobileSmall <= width <= $mobile) {
      width: 70%;
    }
  }

  &__phones {
    justify-self: end;
    display: flex;
    align-items: center;
    column-gap: toEm(4);
    padding-inline: toEm(8);
    padding-block: toEm(4);
    border-radius: toRem(4);
    font-weight: 600;
    color: var(--warning-color);
    background-color: var(--border-color-transparent);
    transition: all var(--transition-duration);

    &:not(:last-child) {
      margin-block-end: toEm(6);
    }

    svg {
      font-size: toRem(22);
      color: var(--danger-color);
    }

    @include hover {
      text-decoration: underline;
      svg {
        color: var(--danger-color);
      }
    }

    &__empty {
      text-align: center;
      padding: toEm(20);
      color: var(--gray-color);
      font-style: italic;
      @include adaptiveValue("font-size", 14, 12);
    }

    &__error {
      text-align: center;
      padding: toEm(16);
      color: var(--danger-color);
      p { margin-block-end: toEm(8); }
    }
  }
}

.sidebar-removed {
  // Стили аккордеона перенесены в компонент UAccordion (глобально, чтобы
  // применять их к слот-контенту). Сайдбар удалён — кнопка закрытия
  // позиционируется абсолютно (.dialog-hamburger__close).
}
</style>
