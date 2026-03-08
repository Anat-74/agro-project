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
  categorySlug?: string;
}
const { product } = defineProps<Props>();

const rotateActive = ref(false);
const toggleActive = () => {
  rotateActive.value = !rotateActive.value;
};

const isVisibleLink = ref(false);
const toggleVisibleLink = () => {
  isVisibleLink.value = !isVisibleLink.value;
};

const handleAddToCart = (product: Product) => {
  if (isInCart(product.id)) {
    cartStore.removeFromCart(product.id);
  } else {
    cartStore.addToCart(product, route.params.categorySlug as string, null);
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
  <li :class="['product-card', { 'product-card_rotate-active': rotateActive }]">
    <div
      :class="[
        'product-card__front',
        { 'product-card__front_front': rotateActive },
      ]"
    >
      <div class="product-card__top-items">
        <Icon
          v-if="product.isDiscount"
          class="product-card__discount"
          name="mdi:discount"
        />
        <ProductStatus class="product-card__in-stock" :product="product" />
        <UButton
          class="product-card__details"
          variant="product-details"
          icon="mdi:rotate-3d"
          @click="toggleActive"
        />
      </div>
      <div class="product-card__content" @click="toggleVisibleLink">
        <UImage
          class="product-card__image"
          v-if="product.image?.length"
          :src="product.image[0]?.url"
          :alt="product.name"
          :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
          :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
          width="180"
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
          <Icon name="my-icon:icon-by-regular" />
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
          @click="handleAddToCart(product)"
          variant="add"
          :is-in-cart="isInCart(product.id)"
          :aria-label="
            isInCart(product.id)
              ? buttonTranslations[currentLocale].ariaLabelAdded
              : buttonTranslations[currentLocale].label
          "
        />
      </div>
    </div>
    <div
      :class="[
        'product-card__back',
        { 'product-card__back_back': rotateActive },
      ]"
    >
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
          :to="`/${currentLocale}/${categorySlug}/products/${product.slug}`"
          ><span>{{
            linkTranslations[currentLocale].featuredProductLabel
          }}</span>
        </NuxtLink>
      </div>
      <div class="product-card__bottom-items">
        <UTooltip :text="tooltipTranslations[currentLocale].byRuble">
          <Icon name="my-icon:icon-by-regular" />
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
          @click="handleAddToCart(product)"
          variant="add"
          :is-in-cart="isInCart(product.id)"
          :aria-label="
            isInCart(product.id)
              ? buttonTranslations[currentLocale].ariaLabelAdded
              : buttonTranslations[currentLocale].label
          "
        />
      </div>
    </div>
  </li>
</template>

<style lang="scss" scoped>
.product-card {
  width: 100%;
  position: relative;
  border-radius: toEm(6);
  perspective: toRem(500);

  &_rotate-active {
    z-index: 150;
    scale: 1.1;
    transform-origin: center;

    @media (max-width: $tablet) {
      margin-block: calc(1 * toEm(16));
    }
  }

  &__front,
  &__back {
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
    backface-visibility: hidden;
    transition: transform 0.6s;
    box-shadow: 0px toEm(6, 15) toEm(18, 15) toRem(5) hsla(0, 0%, 0%, 0.07);
  }

  &__front {
    z-index: 100;

    .product-card__details {
      position: absolute;
      z-index: 150;
      right: toEm(14);
      top: toEm(22);
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
            margin-block-start 0.4s,
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
      margin-block-start 0.4s;

    &_is-visible {
      margin-block-start: toEm(-15);
      color: var(--success-color);
      background-color: var(--light-color);
      transition:
        margin-block-start 0.4s,
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
}
</style>
