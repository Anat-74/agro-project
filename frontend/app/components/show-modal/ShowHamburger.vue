<script setup lang="ts">
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
import { discountProductTranslations } from "~/locales/discountProduct";
import { buttonTranslations } from "~/locales/button";
import { showHamburgerTranslations } from "~/locales/showHamburger";

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

// Ключ состояния: desktop-панель каталога (hamburgerCatalogDesktop) открыта по
// умолчанию, mobile-оверлей (hamburgerDialog) закрыт до тапа. Градации (HeroGrids,
// USocials) слушают hamburgerDialog — desktop-панель их не затемняет.
const dialogKey = computed(() => props.dialogId || "hamburgerDialog")
const isDesktopInstance = computed(() => dialogKey.value === "hamburgerCatalogDesktop")

const { open, close, isOpen } = useDialog(dialogKey.value, dialogElement, {
  useShowMethod: true,
  initialOpen: isDesktopInstance.value, // desktop-панель — открыта по умолчанию (SSR)
})

// Desktop-панель открыта при каждом заходе на страницу: useDialog хранит isOpen
// в глобальном Map, переживающем размонтирование при SPA-навигации
if (isDesktopInstance.value) {
  isOpen.value = true
}

// DOM-ид диалога уникален для каждого инстанса (в документе id не дублируются)
const dialogElementId = computed(() =>
  isDesktopInstance.value ? "dialog-hamburger-desktop" : "dialog-hamburger-mobile",
)

const { width } = useViewport()
// Телепорт — только на mobile (≤768). Выше (desktop) диалог в потоке/под кнопкой
const isMobile = computed(() => width.value <= 767.98)

const { currentLocale } = useLocale();
const route = useRoute();
const config = useRuntimeConfig();
const { getProductLink } = useProductLink();

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
          populate: { image: { fields: ["alternativeText", "url"] } },
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

const openHamburger = () => {
  open?.()
  if (!category.value) executeCategory()
  if (!product.value) executeProduct()
}
</script>

<template>
  <!-- Единый корень: ShowHamburger — fragment, иначе Teleport диалога
       добавляет в grid container-bottom лишний элемент и ломает размещение каталога -->
  <div class="hamburger" :class="props.visibilityClass">
  <div :class="['hamburger-menu']">
    <UButton
      :is-open="isOpen"
      variant="hamburger"
      :aria-label="
        isOpen
           ? buttonT.ariaLabelDialogClosed
           : buttonT.ariaLabelDialogOpen
      "
      @click="isOpen ? close?.() : openHamburger()"
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
      <div class="dialog-hamburger__top visible-mobile">
        <ULogo
          :global="global"
          :current-locale="currentLocale"
          :config="config"
          width="32"
          height="32"
        />
        <UAnimatedText variant="gradient" />
      </div>
      <ul v-if="category?.length" class="dialog-hamburger__accordion accordion">
         <li v-for="cat in category" :key="cat.documentId" class="accordion__item">
          
            <details name="faq" class="accordion__details">
              <summary class="accordion__summary">
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
                <Icon name="mingcute:down-line" />
              </summary>
            </details>

            <div class="accordion__content">
              <ul class="accordion__product-list">
                <li
                  v-for="sub in cat.subcategories"
                  :key="sub.documentId"
                  class="accordion__product-item"
                >
                  <NuxtLink
                    :class="[
                      'accordion__product-link',
                      {
                        'accordion__product-link_is-active': isActive(
                          `/${currentLocale}/${cat.slug}/${sub.slug}`,
                        ),
                      },
                    ]"
                    :to="`/${currentLocale}/${cat.slug}/${sub.slug}`"
                    @click="close?.()"
                  >
                    <UImage
                      v-if="sub.image?.url"
                      :src="sub.image?.url"
                      alt=""
                      class="accordion__product-image-link"
                      width="32"
                      height="32"
                      type="icon"
                    />
                    <h4 class="accordion__product-sub-title">{{ sub.name }}</h4>
                  </NuxtLink>
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
            </div>
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
        
         <details name="faq" class="accordion__details">
          <summary class="accordion__summary accordion__summary_is-discount">
            <Icon
              class="accordion__discount-icon"
              name="mdi:discount-outline"
            />
            <h4 class="accordion__product-sub-title">
              {{ discountT.discount }}
            </h4>
            <Icon name="mingcute:down-line" />
          </summary>
        </details>

        <div class="accordion__content">
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
        </div>
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
    <div class="dialog-hamburger__sidebar sidebar visible-mobile">
      <UButton
        :is-open="isOpen"
        variant="hamburger"
        :aria-label="buttonT.ariaLabelDialogClosed"
        @click="close?.()"
      />
      <USocials :is-open="isOpen" :socials="socials" />
    </div>
    </dialog>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.hamburger {
  height: 100%;   // корень-обёртка — единый grid-элемент
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

  @media (min-width:$mobile) {
    height: toEm(632);
    scale: 0;
    translate: 0;
    // Якорное позиционирование — панель строго под кнопкой (anchor-name
    // на .hamburger-menu), левый край по левому краю кнопки, зазор 22px
    position-anchor: --hamburger-menu;
    position-area: bottom span-right;
    margin-block-start: toRem(22);
    inset: auto;
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

  &__top {
    width: 90%;
    display: grid;
    grid-template-columns: auto 1fr;
    padding-inline: toEm(12);
    padding-block: toEm(2);
    border-radius: toEm(25);
    background-color: var(--light-color);

    @media (max-width: $mobileSmall) {
      width: 100%;
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

.accordion {
  &__details {
    padding-block: toRem(2);

    svg {
      font-size: toRem(22);
    }
  }

  &__details[open] + &__content {
    grid-template-rows: 1fr;
  }

  &__details[open] {
    .accordion__summary {
      color: var(--danger-color);

      svg {
        rotate: -90deg;
        transition: rotate var(--transition-duration);
      }
    }
  }

  &__details:not([open]) {
    .accordion__summary {
      svg {
        transition: rotate var(--transition-duration);
      }
    }
  }

  &__summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: toEm(4);
    font-weight: 600;
    font-size: toEm(22);
    color: var(--primary-color);
    outline: toRem(2) var(--whitesmoke-color) inset;
    border-radius: toRem(4);
    background-color: var(--light-color-transparent);

    @include hover {
      color: var(--warning-color);
    }

    &_is-discount {
      padding-inline: toEm(4);
      padding-block: toRem(6);
      outline: toRem(2) var(--light-color) outset;
      color: var(--danger-color);

      svg {
        color: var(--green-color);
      }

      @include hover {
        color: var(--danger-hover);
      }
    }
  }

  &__content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s;
  }

  &__product-list {
    overflow: hidden;
    color: var(--color);
  }

  &__product-link {
    display: grid;
    grid-template-columns: auto 1fr;
    justify-items: center;
    align-items: center;
    border-radius: toRem(8);
    padding-block-start: toRem(16);
    transition: all var(--transition-duration);

    &_is-discount {
      column-gap: toEm(4);
    }

    // Активная ссылка (текущий маршрут) — выделена цветом
    &_is-active {
      color: var(--danger-color);
      font-weight: 700;
    }

    @include hover {
      color: var(--gray-color);
      text-decoration: underline;
    }
  }

  &__product-sub-title {
    font-weight: 800;
  }

  &__product-title {
    &_is-active {
      color: var(--danger-color);
    }
  }
}

.sidebar {
  display: grid;
  grid-template-rows: repeat(3, auto) 1fr;
  justify-items: center;
  row-gap: toEm(18);
  overflow-y: auto;
  padding-inline: toEm(4);
  padding-block: toEm(12);
  border-left: toEm(2) solid var(--success-color);
  background-color: var(--secondary-color);
}
</style>
