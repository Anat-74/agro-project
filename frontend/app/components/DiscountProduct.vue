<script setup lang="ts">
import { buttonTranslations } from "~/locales/button";

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
  if (width.value < 565.98) return 2;
  if (width.value < 878.98) return 4;
  return 6;
});
</script>

<template>
   <li class="discount-card">
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
        />
        </NuxtLink>
        <h3 class="discount-card__title">{{ product.name }}</h3>
        <span
          :class="[
            'discount-card__price',
            { 'discount-card__price_discount': product?.isDiscount },
          ]"
        >
          {{ formatPrice(product.price) }}
        </span>
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
   display: grid;
   grid-template-columns: auto 1fr auto;
   align-items: center;
   column-gap: toEm(6);
   grid-template-areas: 
   "link title show"
   "link price add"
   ;
   padding-inline: toEm(12);
   padding-block: toEm(6);
   border-radius: toEm(6);
   border: toRem(2) solid var(--whitesmoke-color);

   &__link {
      grid-area: link;
   }

	&__title {
      grid-area: title;
      font-weight: 500;
      transition: color .4s;
	}

   &__price {
      grid-area: price;
   }

	&__show {
      grid-area: show;
      align-self: start;
	}

	&__add {
      grid-area: add;
      align-self: end;
	}
}

</style>