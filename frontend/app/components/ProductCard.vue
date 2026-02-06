<script setup lang="ts">
import type { Product } from "@/types/types";
import { buttonTranslations } from "~/locales/button";
import { tooltipTranslations } from "~/locales/tooltip";
const { currentLocale } = useLocale();
const { isInCart } = useIsInCart();
const cartStore = useCartStore();
const route = useRoute();
const { width } = useViewport();

interface Props {
   product: Product;
   index: number;
   categorySlug: string;
}
const props = defineProps<Props>();

const active = ref(false);
const toggleActive = () => {
  active.value = !active.value;
};

const handleAddToCart = (product: Product) => {
   if (isInCart(product.id)) {
      cartStore.removeFromCart(product.id);
   } else {
      cartStore.addToCart(product, route.params.categorySlug as string, null);
   }
}

const visibleImagesCount = computed(() => {
  if (width.value < 565.98) return 2;
  if (width.value < 878.98) return 4;
  if (width.value < 1215.98) return 6;
  return 10;
});
</script>

<template>
  <li class="product-card">
    <div
      :class="['product-card__front', { 'product-card__front_front': active }]"
    >
      <div class="product-card__top">
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
      <NuxtLink
        class="product-card__link"
        :to="`/${currentLocale}/${categorySlug}/products/${product.slug}`"
      >
        <UImage
          class="product-card__image"
          v-if="product.image?.length"
          :src="product.image[0]?.url"
          :alt="product.name"
         :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
         :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
          width="302"
          height="302"
        />
      </NuxtLink>
      <h3 class="product-card__title">
        {{ product.name }}
      </h3>
      <div class="product-card__bottom">
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
    <div :class="['product-card__back', { 'product-card__back_back': active }]">
      <div class="product-card__top">
        <Icon
          v-if="product.isDiscount"
          class="product-card__discount"
          name="mdi:discount"
        />
        <ProductStatus 
        :product="product" 
        class="product-card__in-stock"
         />
        <UButton
          class="product-card__details"
          variant="product-details"
          icon="mdi:rotate-3d"
          @click="toggleActive"
        />
      </div>
      <!-- <NuxtLink
        class="product-card__link"
        :to="`/${currentLocale}/${categorySlug}/products/${product.slug}`"
      >
        <UImage
          class="product-card__image"
          v-if="product.image?.length"
          :src="product.image[0]?.url"
          :alt="product.name"
          width="302"
          height="302"
        />
      </NuxtLink> -->
      <h3 class="product-card__title">
        {{ product.name }}
      </h3>
      <div class="product-card__bottom">
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
  </li>
</template>

<style lang="scss" scoped>
.product-card {
  width: 100%;
  position: relative;
  padding-block: toEm(12);
  border-radius: toEm(6);
  transition: all var(--transition-duration);
  perspective: toRem(500);
  @include adaptiveValue("height", 500, 350);

  @media (max-width: $mobile) {
    @media (prefers-reduced-motion: no-preference) {
      animation: scroll-animate;
      animation-timeline: view();
      animation-range: entry 0% entry 150%;
    }
  }

   &__front,
   &__back {
      position: absolute;
      inset: 0;
      display: grid;
      justify-items: center;
      align-items: center;
      row-gap: toEm(4);
      padding-block: toEm(12);
      border: toEm(2) solid var(--whitesmoke-color);
      border-radius: toEm(6);
      background-color: var(--light-color);
      color: var(--gray-color);
      backface-visibility: hidden;
      transition: transform .7s;
      box-shadow: 0px toEm(6, 15) toEm(18, 15) toRem(5) hsla(0, 0%, 0%, 0.07);
   }

   &__front {
      z-index: 100;

         &_front {
         transform: rotateY(180deg);
      }
   }

      &__back {
      transform: rotateY(180deg);

         &_back {
         z-index: 110;
         transform: rotateY(360deg);
      }
   }

  &__top {
    justify-self: start;
    align-self: start;
    display: flex;
    align-items: center;
    column-gap: toEm(4);
    padding-inline: toEm(12);
  }

  &__discount {
    color: var(--success-color);
    font-size: toEm(27);
  }

  &__in-stock {
    padding: toEm(4);
  }

  &__details {
    position: absolute;
    z-index: 100;
    right: toEm(14);
    top: toRem(36);
  }

  &__link {
    padding-inline: toEm(6);
    padding-block-end: toEm(4);
  }

  &__title {
    text-align: center;
    transition: color var(--transition-duration);
  }

  &__bottom {
    width: 100%;
    align-self: end;
    display: flex;
    align-items: center;
    padding-inline: toEm(12);
    padding-block: toEm(8);
    background-color: var(--whitesmoke-color);
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
}
</style>
