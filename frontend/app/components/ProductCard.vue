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

// Локализация — единый стиль проекта: computed-объект на текущий язык
const buttonT = computed(() => buttonTranslations[currentLocale.value]);
const linkT = computed(() => linkTranslations[currentLocale.value]);
const tooltipT = computed(() => tooltipTranslations[currentLocale.value]);

interface Props {
  product: Product;
  index: number;
  // Компактный режим (фильтр закрыт на mobile): без переворота,
  // вместо кнопки переворота — кнопка модального окна товара
  compact?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  compact: false,
});
const { product } = props;

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
  // В компактном режиме ссылки на товар нет (только «+» и «глаз»)
  if (props.compact) return
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
        <!-- В компакте статус живёт в вырезе левого верхнего угла (см. ниже):
             внутри маски его обрезало бы вместе с карточкой -->
        <ProductStatus
          v-if="!compact"
          class="product-card__in-stock"
          :product="product"
        />
        <UButton
          v-if="!compact"
          class="product-card__details"
          variant="product-details"
          icon="mdi:rotate-3d"
          :aria-label="buttonT.ariaLabelProductDetails"
          @click="toggleActive"
        />
        <!-- Компактный режим: вместо переворота — модалка товара.
             Обёртка нужна: у ShowModalProduct несколько корней (фрагмент),
             класс снаружи на него не пробрасывается. -->
        <div v-else class="product-card__modal">
          <ShowModalProduct :product="product" />
        </div>
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
          v-if="!compact"
          :class="[
            'product-card__link',
            { 'product-card__link_is-visible': isVisibleLink },
          ]"
          :to="getProductLink(product)"
          ><span>{{
            linkT.featuredProductLabel
          }}</span>
        </NuxtLink>
      </div>
      <div class="product-card__bottom-items">
        <UTooltip :text="tooltipT.byRuble">
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
        <UButton
          v-if="!compact"
          class="product-card__add"
          variant="add"
          :is-in-cart="isInCart(product.documentId)"
          :aria-label="
            isInCart(product.documentId)
              ? buttonT.ariaLabelAdded
              : buttonT.label
          "
          @click="handleAddToCart(product)"
        />
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
        <UButton
          class="product-card__details"
          variant="product-details"
          icon="mdi:rotate-3d"
          :aria-label="buttonT.ariaLabelProductDetails"
          @click="toggleActive"
        />
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
            linkT.featuredProductLabel
          }}</span>
        </NuxtLink>
      </div>
      <div class="product-card__bottom-items">
        <UTooltip :text="tooltipT.byRuble">
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
        <UButton
          class="product-card__add"
          variant="add"
          :is-in-cart="isInCart(product.documentId)"
          :aria-label="
            isInCart(product.documentId)
              ? buttonT.ariaLabelAdded
              : buttonT.label
          "
          @click="handleAddToCart(product)"
        />
      </div>
        </div>
      </div>
    </div>

    <!-- Компактный режим: «В корзину» — плашка в нижнем вырезе (снаружи маски) -->
    <UButton
      v-if="compact"
      class="product-card__add product-card__add_plate"
      variant="add-plate"
      :is-in-cart="isInCart(product.documentId)"
      :aria-label="
        isInCart(product.documentId)
          ? buttonT.ariaLabelAdded
          : buttonT.label
      "
      @click="handleAddToCart(product)"
    >
      <!-- Две грани: при добавлении/удалении плашка переворачивается (ось Y) -->
      <span
        class="product-card__plate-flip"
        :class="{
          'product-card__plate-flip_is-added': isInCart(product.documentId),
        }"
        aria-hidden="true"
      >
        <span class="product-card__plate-face product-card__plate-face_front">
          <Icon name="mdi:cart-arrow-right" />
        </span>
        <span class="product-card__plate-face product-card__plate-face_back">
          <Icon name="mdi:package-variant-closed-check" />
        </span>
      </span>
    </UButton>

    <!-- Статус в вырезе левого верхнего угла (над маской) -->
    <ProductStatus
      v-if="compact"
      class="product-card__status"
      :product="product"
    />
  </li>
</template>

<style lang="scss" scoped>
// Геометрия выреза — ОДИН источник для маски и плашки. Плашка стоит В УГЛУ
// (заподлицо справа и снизу), поэтому вырез по X и Y = плашка + зазор.
// Меняешь $plate-size/$notch-gap — маска и кнопка пересчитываются вместе.
$plate-size: 50.5;
$notch-gap: 8;
$notch-s: ($plate-size + $notch-gap) * 0.5; // радиус дуги = 29.25
$notch-x: $plate-size + $notch-gap; // вырез по X и Y = 58.5
$notch-r: ($notch-x - $notch-s) * 0.5; // радиус кромок карточки/BR плашки = 14.625
$plate-tl: $notch-s - $notch-gap; // TL: концентричен дуге = 21.25
$plate-inner: 12; // TR/BL: меньше, чем BR — они у прямых кромок выреза
// Вырез под статус в левом верхнем углу (координаты viewBox карточки)
$stat-w: 104;
$stat-h: 30;
$stat-r: 6;
// Узкая карточка (CQ ≤170px)
$plate-size-cq: 46;
$notch-s-cq: ($plate-size-cq + $notch-gap) * 0.5; // 27
$notch-x-cq: $plate-size-cq + $notch-gap; // 54
$notch-r-cq: ($notch-x-cq - $notch-s-cq) * 0.5; // 13.5
$plate-tl-cq: $notch-s-cq - $notch-gap; // 19

.product-card {
  width: 100%;
  position: relative;
  // Радиус карточки — один источник для неё, вложенной поверхности и кнопки (BR)
  --card-radius: #{toRem(6)};
  border-radius: var(--card-radius);
  perspective: toRem(500);
  max-width: toRem(220);
  // Высота — от ширины самой карточки (авто-подстройка в любой сетке).
  // На главной секции переопределяют высоту через containerAdaptive (335/265).
  aspect-ratio: 172 / 250;
  // Плашка и зазор; r/s выводятся из них (SCSS-константы $notch-*) и зашиты
  // в маску. Плашка в углу: заподлицо справа и снизу, воздух сверху и слева.
  --plate-size: #{$plate-size}px;
  --notch-gap: #{$notch-gap}px;
  --plate-inset: 0px;
  --notch-r: #{$notch-r}px;
  --notch-s: #{$notch-s}px;
  --plate-tl: #{$plate-tl}px;
  --plate-inner: #{$plate-inner}px;
  // Плавная реакция 3D-кнопки: scale (transform) + margin-block (сдвиг нижнего
  // ряда). Сохраняем глобальные li:hover-переходы (opacity/filter/shadow/color).
  transition:
    scale var(--transition-duration-fast),
    margin-block var(--transition-duration-fast),
    opacity 0.4s,
    filter 0.4s,
    box-shadow 0.4s,
    color 0.4s;
  // Миксины — после всех свойств, перед вложенными селекторами
  @include containerParent(card productImage, inline-size);

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
      right: toEm(19);
      top: toEm(27);
    }

    // Вырез снизу справа строится напрямую (без scaleY(-1)): трансформ
    // промоутит маскированный слой, и на телефоне край маски мылится.
    // SVG-путь вместо градиентных слоёв: дуга остаётся резкой на телефоне.
    .product-card__surface {
      border-radius: var(--notch-r, 13px);
      // $r/$s — без единиц: это координаты SVG-пути (px в пути недопустимы)
      @include notchMask(172, 250, $notch-r, $notch-s, 0, $stat-w, $stat-h, $stat-r);
    }

    // Компакт: ссылки на товар нет, поэтому и контент не интерактивен. Иначе
    // клик/тап по фото включает sticky-hover и заголовок «подпрыгивает» вверх.
    .product-card__content {
      pointer-events: none;
    }

    // Страховка: если заголовок был поднят до перехода в компакт (был hover на
    // карточке с фильтром), класс _is-visible не должен оставлять его вверху.
    .product-card__title_is-visible {
      margin-block-start: 0;
      color: inherit;
      background-color: transparent;
    }

    // Мелкая карточка (узкий телефон): плашка и вырез меньше, зазор тот же
    @container card (max-width: 170px) {
      .product-card__surface {
        @include notchMask(172, 250, $notch-r-cq, $notch-s-cq, 0, $stat-w, $stat-h, $stat-r);
      }

      .product-card__add {
        --plate-size: #{$plate-size-cq}px;
        --notch-r: #{$notch-r-cq}px;
        --notch-s: #{$notch-s-cq}px;
        --plate-tl: #{$plate-tl-cq}px;
      }
    }
  }







  &__front,
  &__back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    transition: transform 0.6s;
  }

  // Слой-«поверхность»: маска строит вырез сразу в правом нижнем углу,
  // без переворота слоя. Сам вырез включается ТОЛЬКО в компактном режиме
  // (фильтр закрыт) — см. &_compact.
  &__surface {
    position: absolute;
    inset: 0;
  }

  // Здесь фон, рамка, скругление и тень
  &__surface-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-block: toEm(12);
    border: toEm(2) solid var(--whitesmoke-color);
    border-radius: var(--card-radius);
    background-color: var(--light-color);
    color: var(--gray-color);
    box-shadow: 0px toEm(6, 15) toEm(18, 15) toRem(5) hsla(0, 0%, 0%, 0.07);
  }

  &__front {
    z-index: 100;

    .product-card__details {
      position: absolute;
      z-index: 150;
      right: toEm(19);
      top: toEm(27);
    }

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

  // «В корзину»: в обычном режиме кнопка живёт в нижней полосе (у цены),
  // в компактном — плашка в вырезе (absolute, снаружи маски).
  &__add_plate {
    position: absolute;
    z-index: 150;
    width: var(--plate-w, var(--plate-size, var(--notch-size)));
    // +1px компенсирует сдвиг вниз: верх кнопки остаётся на месте, воздух
    // сверху не меняется, а низ совпадает с видимой кромкой карточки
    height: calc(var(--plate-size, var(--notch-size)) + 1px);
    right: var(--plate-inset, var(--notch-gap));
    // Низ кнопки = видимая кромка карточки: маска обрезает кромку с AA, и её
    // последняя строка полупрозрачная — без -1px кнопка читается на 1px выше.
    bottom: -1px;

    // Слот у .btn обёрнут в .button-content — растягиваем на всю плашку,
    // иначе absolute-грани не получат размеров. Элемент создаётся внутри
    // UButton, поэтому нужен :deep (иначе scoped-атрибут не совпадёт).
    :deep(.button-content) {
      display: block;
      width: 100%;
      height: 100%;
    }

    // 3D-переворот вокруг оси Y: лицевая грань (не в корзине) ↔ обратная
    .product-card__plate-flip {
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      // Тайминг как у переворота карточки
      transition: transform 0.6s;

      &_is-added {
        transform: rotateY(180deg);
      }
    }

    .product-card__plate-face {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: toRem(1) solid var(--success-color);
      // «Пазл»: TL = радиус дуги − зазор (концентричен дуге), BR = радиус
      // кромки карточки, а TR/BL — меньше: они примыкают к прямым кромкам
      // выреза, и такой же радиус там читался бы слишком круглым.
      border-radius: var(--notch-r, 15px);
      border-top-left-radius: var(--plate-tl, 21.25px);
      border-top-right-radius: var(--plate-inner, 12px);
      border-bottom-left-radius: var(--plate-inner, 12px);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;

      :deep(svg) {
        font-size: calc(var(--plate-size, var(--notch-size, 44px)) * 0.45);
      }
    }

    .product-card__plate-face_front {
      background-color: var(--light-color);
      // Рамка в цвет фона кнопки — на фронтальной грани зелёный контур не нужен
      border-color: var(--light-color);
      color: var(--green-color);
    }

    .product-card__plate-face_back {
      background-color: var(--success-color);
      color: var(--light-color);
      transform: rotateY(180deg);
    }

    @media (prefers-reduced-motion: reduce) {
      .product-card__plate-flip {
        transition: none;
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

  // Статус в вырезе левого верхнего угла (слой над маской). Размеры — те же
  // координаты viewBox, что у выреза, поэтому заданы в процентах: совпадают
  // при любом размере карточки (маска тоже тянется).
  &__status {
    position: absolute;
    z-index: 160;
    inset-block-start: 0;
    inset-inline-start: 0;
    display: grid;
    place-items: center;
    width: calc(#{$stat-w} / 172 * 100%);
    height: calc(#{$stat-h} / 250 * 100%);
    padding-inline: 6%;
    color: var(--light-color);
    font-size: toEm(14);
    text-align: center;

    :deep(.in-stock),
    :deep(.to-order) {
      color: var(--light-color);
    }
  }

  &__content {
    flex: 1 1 auto;
    // Длинный текст не должен выталкивать нижнюю полосу (и плашку) за карточку
    min-height: 0;
    overflow: hidden;
  }

  &__title {
    position: relative;
    z-index: 100;
    text-align: center;
    padding-inline: toEm(4);
    padding-block-start: toEm(2);
    padding-block-end: toEm(12);
    // Максимум 2 строки: длинные названия не растягивают карточку
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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
    // Фон — как у самой карточки (серая полоса на уровне цены убрана)
    background-color: transparent;
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
@container card (max-width: 230px) {
  .product-card__front,
  .product-card__back {
    padding-block: toEm(4);
  }

  .product-card__top-items {
    padding-inline: toEm(6);
    padding-block-end: toEm(6);
  }

  .product-card__title {
    font-size: toEm(13);
    padding-inline: toEm(2);
    padding-block-end: toEm(6);
  }

  // «ПОДРОБНЕЕ» (скрытая кнопка) — компактная вместе с карточкой
  .product-card__link {
    font-size: toEm(12);
    padding-inline: toEm(16);
    padding-block: toEm(6);
  }

  .product-card__bottom-items {
    padding-inline: toEm(8);
    padding-block: toEm(6);
  }
}

</style>