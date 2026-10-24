<script setup lang="ts">
import { buttonTranslations } from "~/locales/button";
import { tooltipTranslations } from "~/locales/tooltip";
import { linkTranslations } from "~/locales/link";
const { currentLocale } = useLocale();
const { isInCart } = useIsInCart();
const cartStore = useCartStore();
const route = useRoute();
const { width } = useViewport();
const { getProductLink } = useProductLink();

interface Props {
  product: Product;
  index: number;
  // Компактный режим (фильтр закрыт на mobile): без переворота,
  // вместо кнопки переворота — кнопка модального окна товара
  compact?: boolean;
  // ВРЕМЕННО (демо стилей кнопки): 1..5 — вариант плашки «3D»
  detailsVariant?: number;
  // ВРЕМЕННО (демо): 1..5 — форма/ширина плашки «в корзину»
  addVariant?: number;
}
const props = withDefaults(defineProps<Props>(), {
  compact: false,
  detailsVariant: 0,
  addVariant: 0,
});
const { product } = props;

// Иконки демо-вариантов кнопки в вырезе
const detailsIcon = computed(() => {
  const icons: Record<number, string> = {
    1: "mdi:eye-outline",
    2: "mdi:eye",
    3: "mdi:magnify-plus-outline",
    4: "mdi:cube-outline",
    5: "mdi:arrow-top-right",
  }
  return icons[props.detailsVariant] ?? "mdi:rotate-3d"
})

const rotateActive = ref(false);
const toggleActive = () => {
  if (props.compact) return;
  rotateActive.value = !rotateActive.value;
};

// При переходе в компактный режим возвращаем карточку на лицевую сторону
watch(
  () => props.compact,
  (isCompact) => {
    if (isCompact) rotateActive.value = false;
  },
);

const isVisibleLink = ref(false);
const toggleVisibleLink = () => {
  isVisibleLink.value = !isVisibleLink.value;
};

const handleAddToCart = (product: Product) => {
  if (isInCart(product.documentId)) {
    cartStore.removeFromCart(product.documentId);
  } else {
    const slug = (route.params.categorySlug as string)
      || product.subcategory?.category?.slug
      || product.category?.slug
      || ''
    cartStore.addToCart(product, slug, product.subcategory?.slug || null);
  }
};

const visibleImagesCount = computed(() => {
  if (width.value < 479.98) return 2;
  if (width.value < 767.98) return 3;
  if (width.value < 1023.98) return 4;
  return 6;
});

const characteristics = computed(() => {
  try {
    return JSON.parse(product?.characteristics || "[]");
  } catch {
    return [];
  }
});
</script>

<template>
  <li
    :class="[
      'product-card',
      { 'product-card_rotate-active': rotateActive, 'product-card_compact': compact },
    ]"
  >
    <div
      :class="[
        'product-card__front',
        { 'product-card__front_front': rotateActive },
      ]"
    >
      <!-- Два маскированных слоя: front режет верх-справа (кнопка «3D»),
           surface перевёрнут и тем же кодом режет низ-справа (кнопка «в корзину»),
           inner возвращает контент в нормальное положение и несёт фон/рамку. -->
      <div class="product-card__surface">
        <div class="product-card__surface-inner">
          <div class="product-card__top-items">
        <Icon
          v-if="product.isDiscount"
          class="product-card__discount"
          name="mdi:discount"
        />
        <ProductStatus class="product-card__in-stock" :product="product" />
      </div>
      <div class="product-card__content" @click="toggleVisibleLink">
        <UImage
          v-if="product.image?.length"
          type="product"
          class="product-card__image"
          :src="product.image[0]?.url"
          :alt="product.name"
          :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
          :priority="index < visibleImagesCount ? 'high' : 'auto'"
          width="200"
          height="160"
        />
        <h3
          :class="[
            'product-card__title',
            { 'product-card__title_is-visible': isVisibleLink },
          ]"
        >
          {{ product.name }}
        </h3>
        <NuxtLink
          :class="[
            'product-card__link',
            { 'product-card__link_is-visible': isVisibleLink },
          ]"
          :to="getProductLink(product)"
          ><span>{{
            linkTranslations[currentLocale].featuredProductLabel
          }}</span>
        </NuxtLink>
      </div>
      <div class="product-card__bottom-items">
        <UTooltip :text="tooltipTranslations[currentLocale].byRuble">
          <UIconLocal name="icon-by-regular" />
        </UTooltip>
        <span
          :class="[
            'product-card__price',
            { 'product-card__price_discount': product.isDiscount },
          ]"
        >
          {{ formatPrice(product.price) }}
        </span>
      </div>
        </div>
      </div>
    </div>
    <div
      v-if="!compact"
      :class="[
        'product-card__back',
        { 'product-card__back_back': rotateActive },
      ]"
    >
      <div class="product-card__surface">
        <div class="product-card__surface-inner">
          <div class="product-card__top-items">
        <Icon
          v-if="product.isDiscount"
          class="product-card__discount"
          name="mdi:discount"
        />
        <ProductStatus :product="product" class="product-card__in-stock" />
      </div>
      <div class="product-card__content">
        <p class="product-card__description">
          <span class="product-card__name">{{ product.name }}</span>
          {{ product.description }}
        </p>
        <ProductCharacteristics
          class="product-card__characteristics"
          :specs="characteristics"
        />
        <NuxtLink
          class="product-card__link"
          :to="getProductLink(product)"
          ><span>{{
            linkTranslations[currentLocale].featuredProductLabel
          }}</span>
        </NuxtLink>
      </div>
      <div class="product-card__bottom-items">
        <UTooltip :text="tooltipTranslations[currentLocale].byRuble">
          <UIconLocal name="icon-by-regular" />
        </UTooltip>
        <span
          :class="[
            'product-card__price',
            { 'product-card__price_discount': product?.isDiscount },
          ]"
        >
          {{ formatPrice(product.price) }}
        </span>
      </div>
        </div>
      </div>
    </div>

    <!-- Кнопка-«плашка» вынесена из-под маски: маска режет только поверхность,
         а кнопка лежит в вырезе слоем выше (иначе её срезает вместе с карточкой).
         В компактном режиме вместо переворота — модалка товара (обёртка нужна:
         у ShowModalProduct несколько корней, класс наружу не пробрасывается). -->
    <UButton
      v-if="!compact"
      :class="[
        'product-card__details',
        detailsVariant ? `product-card__details_v${detailsVariant}` : '',
      ]"
      variant="product-details"
      :icon="detailsIcon"
      :aria-label="buttonTranslations[currentLocale].ariaLabelProductDetails"
      @click="toggleActive"
    />
    <div v-else class="product-card__modal">
      <ShowModalProduct :product="product" />
    </div>

    <!-- «В корзину» — плашка в нижнем вырезе: снаружи маски, слой выше поверхности -->
    <UButton
      :class="[
        'product-card__add',
        addVariant ? `u-button_notch_v${addVariant}` : '',
      ]"
      variant="notch"
      :is-in-cart="isInCart(product.documentId)"
      :aria-label="
        isInCart(product.documentId)
          ? buttonTranslations[currentLocale].ariaLabelAdded
          : buttonTranslations[currentLocale].label
      "
      @click="handleAddToCart(product)"
    />
  </li>
</template>

<style lang="scss" scoped>
.product-card {
  width: 100%;
  position: relative;
  border-radius: toEm(6);
  perspective: toRem(500);
  max-width: toRem(220);
  @include containerAdaptive("height", 320, 250, 1000, 360);
  @include containerParent(card productImage, inline-size);
  // Плавная реакция 3D-кнопки: scale (transform) + margin-block (сдвиг нижнего
  // ряда). Сохраняем глобальные li:hover-переходы (opacity/filter/shadow/color).
  transition:
    scale var(--transition-duration-fast),
    margin-block var(--transition-duration-fast),
    opacity 0.4s,
    filter 0.4s,
    box-shadow 0.4s,
    color 0.4s;

  &_rotate-active {
    z-index: 150;
    scale: 1.1;
    transform-origin: center;
    // Нижний отступ плавно «отодвигает» следующий ряд карточек: grid-трек растёт
    // (маржа учитывается в размере ряда), компенсируя нижнюю половину scale-роста
    // (~17px на карточке 340px высотой), — нижний ряд реагирует с анимацией.
    margin-block-end: toEm(22);

    @media (max-width: $tablet) {
      margin-block-start: toEm(16);
    }
  }

  // Компактный режим (фильтр закрыт): переворота нет, кнопка модалки сверху справа
  &_compact {
    perspective: none;

    .product-card__modal {
      position: absolute;
      z-index: 150;
      right: toEm(14);
      top: toEm(22);
    }
  }

  &__front,
  &__back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    transition: transform 0.6s;
    // Вырез под кнопку «3D»/модалки — правый верхний угол
    @include invertedRadius(16px, 24px);
  }

  // Слой-«поверхность»: перевёрнут, поэтому тот же код режет низ-справа
  // (вырез под кнопку «в корзину»). Фон/рамка/тень — на inner.
  &__surface {
    position: absolute;
    inset: 0;
    transform: scaleY(-1);
    // Вырез под кнопку «в корзину»: чуть крупнее верхнего
    @include invertedRadius(18px, 30px);
  }

  // Контент возвращаем в нормаль; здесь же фон, рамка, скругление и тень
  &__surface-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-block: toEm(12);
    border: toEm(2) solid var(--whitesmoke-color);
    border-radius: toEm(6);
    background-color: var(--light-color);
    color: var(--gray-color);
    box-shadow: 0px toEm(6, 15) toEm(18, 15) toRem(5) hsla(0, 0%, 0%, 0.07);
    transform: scaleY(-1);
  }

  &__front {
    z-index: 100;

    .product-card__content {
      @include hover {
        .product-card__link {
          visibility: visible;
          opacity: 1;
          display: block;
          transition:
            opacity 0.9s,
            visibility 0.9s,
            background-color 0.4s,
            color var(--transition-duration);

          @starting-style {
            opacity: 0;
            visibility: hidden;
          }
        }

        .product-card__title {
          margin-block-start: toEm(-12);
          color: var(--success-color);
          background-color: var(--light-color);
          transition:
            margin-block-start 0.3s,
            color var(--transition-duration);
        }
      }
    }

    .product-card__link {
      justify-self: center;
      opacity: 0;
      visibility: hidden;
      display: none;

      &_is-visible {
        visibility: visible;
        opacity: 1;
        display: block;
        transition:
          opacity 0.9s,
          visibility 0.9s,
          background-color 0.4s,
          color var(--transition-duration);

        @starting-style {
          opacity: 0;
          visibility: hidden;
        }
      }
    }

    .product-card__bottom-items {
      position: absolute;
      bottom: toEm(12);
    }

    &_front {
      transform: rotateY(180deg);
    }
  }

  &__back {
    transform: rotateY(180deg);

    .product-card__top-items {
      padding-block-end: toRem(2);
    }

    .product-card__in-stock {
      font-size: toEm(15);
    }

    .product-card__content {
      display: grid;
      justify-items: center;
      row-gap: toEm(12);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--success-color) var(--whitesmoke-color);
      padding-inline: toEm(9);
      padding-block-start: toEm(5);
      padding-block-end: toEm(12);

      visibility: hidden;
      opacity: 0;
      transition:
        opacity 1s,
        visibility 1s;

      &:not(:last-child) {
        margin-block-end: toEm(9);
      }
    }

    .product-card__details {
      font-size: toEm(16);
    }

    .product-card__link {
      padding-block: toEm(6);
      margin-block-start: toEm(12);
      transition:
        background-color var(--transition-duration),
        color var(--transition-duration);

      span {
        font-size: toEm(14);
      }
    }

    &_back {
      z-index: 110;
      transform: rotateY(360deg);

      .product-card__content {
        visibility: visible;
        opacity: 1;
        transition:
          opacity 1.5s,
          visibility 1.5s;

        @starting-style {
          opacity: 0;
          visibility: hidden;
        }
      }
    }
  }

  // «В корзину» — плашка в нижнем вырезе (снаружи маски).
  // Размер и позиция ВЫВОДЯТСЯ из выреза: вырез 66px (s=30 + 2r=36),
  // зазор с каждой стороны = (66 - размер) / 2 → отступы одинаковые.
  &__add {
    --notch-size: 46px;
    position: absolute;
    z-index: 150;
    width: var(--notch-size);
    height: var(--notch-size);
    right: calc((66px - var(--notch-size)) / 2);
    bottom: calc((66px - var(--notch-size)) / 2);
  }

  // Кнопка-«плашка» — снаружи маски (в вырезе карточки), слой выше поверхности
  &__details {
    position: absolute;
    z-index: 150;
    right: 6px;
    top: 6px;
    width: 44px;
    height: 44px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
    font-size: toEm(22);

    svg {
      font-size: toEm(24);
    }

    // ВРЕМЕННО (демо): 5 вариантов стиля плашки
    // 1 — сплошной зелёный + белая иконка
    &_v1 {
      background-color: var(--success-color);
      color: var(--light-color);
      box-shadow: 0 6px 14px rgba(39, 76, 91, 0.28);

      @include hover {
        background-color: var(--green-color);
      }
    }

    // 2 — светлая с зелёным кольцом
    &_v2 {
      background-color: var(--light-color);
      color: var(--success-color);
      border: 2px solid var(--success-color);
      box-shadow: 0 4px 12px rgba(39, 76, 91, 0.18);

      @include hover {
        background-color: var(--success-color);
        color: var(--light-color);
      }
    }

    // 3 — градиент + свечение
    &_v3 {
      background: linear-gradient(135deg, var(--success-color), #79c98a);
      color: #fff;
      box-shadow:
        0 8px 20px rgba(76, 175, 80, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);

      @include hover {
        box-shadow:
          0 10px 24px rgba(76, 175, 80, 0.6),
          inset 0 1px 0 rgba(255, 255, 255, 0.45);
      }
    }

    // 4 — «стекло» (glassmorphism)
    &_v4 {
      background-color: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.55);
      backdrop-filter: blur(8px);
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

      @include hover {
        background-color: rgba(255, 255, 255, 0.4);
      }
    }

    // 5 — тёплый акцент (оранжевый)
    &_v5 {
      background-color: var(--warning-color);
      color: var(--dark-color);
      box-shadow: 0 6px 14px rgba(239, 166, 64, 0.45);

      @include hover {
        background-color: var(--danger-hover);
        color: var(--light-color);
      }
    }
  }

  &__top-items {
    align-self: start;
    width: 100%;
    display: flex;
    align-items: center;
    column-gap: toEm(4);
    padding-inline: toEm(12);
    padding-block-end: toEm(12);
  }

  &__discount {
    color: var(--success-color);
    font-size: toEm(27);
  }

  &__in-stock {
    flex: 1 1 auto;
    padding: toEm(4);
  }

  &__content {
    flex: 1 1 auto;
  }

  &__title {
    position: relative;
    z-index: 100;
    text-align: center;
    padding-inline: toEm(4);
    padding-block-start: toEm(2);
    padding-block-end: toEm(12);
    transition:
      color var(--transition-duration),
      margin-block-start var(--transition-duration);

    &_is-visible {
      margin-block-start: toEm(-15);
      color: var(--success-color);
      background-color: var(--light-color);
      transition:
        margin-block-start var(--transition-duration),
        color var(--transition-duration);
    }
  }

  &__description {
    font-size: toEm(15);

    &::first-letter {
      color: var(--danger-hover);
      font-style: italic;
      margin-inline-end: toRem(1);
    }

    span {
      font-weight: 600;
      color: var(--success-color);
    }
  }

  &__link {
    text-transform: uppercase;
    font-size: toEm(14);
    padding-inline: toEm(30);
    padding-block: toEm(8);
    border: 1px solid var(--warning-color);
    border-radius: toEm(4);
    font-weight: 700;
    color: var(--warning-color);

    @include hover {
      color: var(--light-color);
      background-color: var(--warning-color);
    }
  }

  &__bottom-items {
    position: relative;
    z-index: 20;
    width: 100%;
    display: flex;
    align-items: center;
    padding-inline: toEm(12);
    padding-block: toEm(8);
    background-color: var(--whitesmoke-color);

    &_is-visible {
      margin-block-start: toRem(-32);
    }
  }

  &__price {
    flex: 1 1 auto;
    padding-inline-start: toEm(3);
    font-weight: 600;
    color: var(--gray-color);

    &_discount {
      font-weight: 600;
      color: var(--green-color);
    }
  }

  &:deep(.product-card__characteristics) {
    width: 100%;

    .product-characteristics {
      &__title {
        display: none;
      }

      &__table {
        font-size: toEm(14);
      }
    }
  }
  // Анимации для custom-темы
  @container style(--theme: custom) {
    animation: cardEntrance 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    opacity: 0;

    &__title {
      animation: typewriter 1.2s steps(30) 0.6s forwards;
      overflow: hidden;
      white-space: nowrap;
      width: 0;
    }

    &__link {
      animation: buttonPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 1.0s forwards;
      opacity: 0;
      transform: scale(0.8);
    }
  }

}

// Компактные карточки (узкий контейнер, напр. сетка товаров ~180px):
// уплотняем внутреннюю вёрстку по ширине самой карточки, а не вьюпорта.
// Ширину изображения НЕ задаём — ей управляет UImage (type="product" + @container product).
@container card (max-width: 210px) {
  .product-card__front,
  .product-card__back {
    padding-block: toEm(4);
  }

  .product-card__top-items {
    padding-inline: toEm(8);
    padding-block-end: toEm(8);
  }

  .product-card__title {
    font-size: toEm(14);
    padding-block-end: toEm(8);
  }
}
</style>