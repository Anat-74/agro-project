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
        <div class="discount-card__items">
        <h3 class="discount-card__title">{{ product.name }}</h3>
        <span
          :class="[
            'discount-card__price',
            { 'discount-card__price_discount': product?.isDiscount },
          ]"
          v-if="product?.price"
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
   </li>
</template>

<style lang="scss" scoped>
.discount-card {
   display: flex;
   flex-wrap: wrap;
   padding-inline: toEm(12);
   padding-block: toEm(6);
   border-radius: toEm(6);
   background-color: var(--gray-color);
}
</style>