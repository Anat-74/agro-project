<script setup lang="ts">
import { buttonTranslations } from "~/locales/button";
import { tooltipTranslations } from "~/locales/tooltip";

const { currentLocale } = useLocale();
const cartStore = useCartStore();
const route = useRoute();
const { isInCart } = useIsInCart();
const { width } = useViewport();

interface Props {
   product: Product;
   index: number;
}
const { product } = defineProps<Props>();

const handleAddToCart = (product: Product) => {
  if (isInCart(product.id)) {
    cartStore.removeFromCart(product.id);
  } else {
    cartStore.addToCart(product, route.params.categorySlug as string, null);
  }
};

const visibleImagesCount = computed(() => {
  if (width.value < 767.98) return 4;
  return 6;
});
</script>

<template>
   <li class="discount-card">
      <Icon
          v-if="product.isDiscount"
          class="discount-card__discount"
          name="mdi:discount"
        />
      <NuxtLink
      class="discount-card__link"
      :to="`/${currentLocale}/${product.category?.slug}/products/${product.slug}`"
      >
      <UImage
          v-if="product.image?.length"
          :src="product.image[0]?.url"
          :alt="product.name"
          :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
          :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
          width="100"
          height="100"
          type="discount-product"
        />
        </NuxtLink>
        <h3 class="discount-card__title">{{ product.name }}</h3>
        <div class="discount-card__items-price">
         <UTooltip :text="tooltipTranslations[currentLocale].byRuble">
          <Icon name="my-icon:icon-by-regular" />
        </UTooltip>
            <span
          :class="[
            'discount-card__price',
            { 'discount-card__price_discount': product?.isDiscount },
          ]"
        >
          {{ formatPrice(product.price) }}
        </span>
        </div>
        <UButton
        class="discount-card__show"
        icon="mdi:show-outline"
        />
        <UButton
          class="discount-card__add"
          @click="handleAddToCart(product)"
          variant="add"
          :is-in-cart="isInCart(product.id)"
          :aria-label="
          isInCart(product.id)
          ? buttonTranslations[currentLocale].ariaLabelAdded
          : buttonTranslations[currentLocale].label
          "
        />
   </li>
</template>

<style lang="scss" scoped>
.discount-card {
   position: relative;
   display: grid;
   grid-template-columns: auto 1fr auto;
   justify-items: start;
   align-items: center;
   column-gap: toEm(12);
   grid-template-areas: 
   "link title show"
   "link price add"
   ;
   padding-inline: toEm(12);
   padding-block: toEm(9);
   border-radius: toEm(6);
   border: toEm(2) solid var(--whitesmoke-color);

   @media (max-width:$tablet){
      background-color: var(--light-color);
   }

   @media (max-width:toEm(800)){
      &:last-child {
         display: none;
      }
   }

   @media (max-width: toEm(540)) {
   grid-template-columns: repeat(2, auto);
   row-gap: toEm(8);
   grid-template-areas: 
      "link show"
      "title add"
      "price add"
   ;
   }

   &__discount {
      position: absolute;
      top: toRem(2);
      left: toRem(2);
      z-index: 10;
      border-radius: 50%;
      color: var(--success-color);
      background-color: var(--light-color);
   }

   &__link {
      grid-area: link;
   }

	&__title {
      grid-area: title;
      font-weight: 500;
      transition: color .4s;
	}

   &__items-price {
      grid-area: price;
      display: flex;
      align-items: center;
      column-gap: toEm(2);
   }

   &__price {
      border-radius: toEm(4);
      font-weight: 600;
      color: var(--gray-color);

      &_discount {
         color: var(--green-color);
      }
   }

	&__show {
      grid-area: show;
      align-self: start;
      translate: toEm(-6) toRem(6);
      padding-inline: toEm(5);
      border-radius: 50%;
      color: var(--gray-color);
      background-color: var(--whitesmoke-color);

      @media (max-width:toEm(540)){
         translate: toEm(-4) toEm(16);
      }
	}

	&__add {
      grid-area: add;
      justify-self: end;
      align-self: end;
	}
}
</style>