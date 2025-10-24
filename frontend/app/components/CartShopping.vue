<script setup lang="ts">
import { formatPrice } from '~/utils/formatPrice'
import type { LocaleCode } from "../types/types"
import { cartTranslations } from '~/locales/cart'
import { buttonTranslations } from '~/locales/button'

const cartStore = useCartStore()
const { currentLocale } = useLocale()
const config = useRuntimeConfig()

const getProductLink = (product: CartItem['product']) => {
  return `/${currentLocale.value}/${product.categorySlug}/${product.subcategorySlug}/${product.slug}`
}

const switchToLocale = (locale: string) => {
  const { switchLocale } = useLocale()
  switchLocale(locale as LocaleCode)
}

onMounted(() => {
  cartStore.loadCart()
})
</script>

<template>
    <ul
   class="cart-item"
    >
      <li 
      v-for="item in cartStore.items" 
      :key="item.product.id"
      class="cart-item__item"
      >
      <div v-if="item.product.originalLocale !== currentLocale" 
      class="cart-item__locale-warning"
      >
        <Icon name="mdi:alert" />
        <span>{{ cartTranslations[currentLocale].warningLocale }}</span>
        <UButton
         :label="item.product.originalLocale"
         name-class="switch-locale-cart"
         @click="switchToLocale(item.product.originalLocale)"
         />
      </div>

      <Icon 
      v-if="item.product.isDiscount"
      class="cart-item__discount-icon"
      name="mdi:discount" />
        <h3 class="cart-item__title" >{{ item.product.name }}</h3>
        <NuxtLink
        :to="getProductLink(item.product)"
        :class="['cart-item__link', {'cart-item__link_disabled': item.product.originalLocale !== currentLocale}]"
          >
        <NuxtImg
         class="cart-item__image"
         :src="`${config.public.strapi.url}${item.product.image}`"
         :alt="item.product.name"
          format="webp"
          loading="lazy"
          decoding="async"
          width="144"
          height="108"
        />
      </NuxtLink>
        <span class="cart-item__price">
         <Icon name="my-icon:icon-by-regular" />
         {{ formatPrice(item.product.price) }}
      </span>
        <div class="cart-item__controls">
        <UButton
         @click="cartStore.updateQuantity(item.product.id, item.quantity -1)"
         :disabled="item.quantity <= 1"
         name-class="remove-quantity-prod"
         :aria-label="buttonTranslations[currentLocale].ariaLabelReduceQuantity"
        />
         <span 
         class="quantity-value"
         aria-live="polite"
         role="status"
         aria-atomic="true"
      >
    {{ item.quantity }}
  </span>
        <UButton
         @click="cartStore.updateQuantity(item.product.id, item.quantity +1)"
         name-class="add-quantity-prod"
         :aria-label="buttonTranslations[currentLocale].ariaLabelIncreaseQuantity"
        />
      </div>
        <UButton
        @click="cartStore.removeFromCart(item.product.id)"
        name-class="remove-cart-item"
        icon="material-symbols:delete-outline-rounded"
        class="cart-item__remove-from-cart"
        :aria-label="buttonTranslations[currentLocale].ariaLabelRemoveItemFromCart"
        />
      </li>
    </ul>
 </template>

 <style lang="scss" scoped>
.cart-item {
&__item {
   position: relative;
   display: grid;
   grid-template-columns: auto repeat(3, 1fr) auto;
   justify-items: center;
   align-items: center;
   grid-template-areas: 
   'link title controls price remove'
   'link title controls price remove'
   ;
   padding: toEm(7);
   border: toRem(2) solid var(--bg);
   border-radius: toRem(6);

   &:not(:last-child) {
      margin-block-end: toEm(16);
   }

   @media (max-width: toEm(639.98)){
      grid-template-columns: auto 1fr;
      justify-items: start;
      grid-template-areas: 
      'link price'
      'link title'
      'remove controls'
      ;
   }
}

&__locale-warning {
   position: absolute;
   top: toRem(-2);
   left: 0;
  padding: toEm(4);
  border-radius: toEm(4);
  display: flex;
  align-items: center;
  gap: toEm(8);
  font-weight: 600;
  background-color: var(--locale-warning-color);
  color: var(--danger-color);

  svg {
   font-size: toEm(18);
  }
}

&__discount-icon {
   position: absolute;
   top: toEm(2);
   left: toEm(2);
   color: var(--lime-color);
   font-size: toEm(20);
}

&__title {
   grid-area: title;
   color: var(--color);

   @media (max-width: toEm(639.98)){
      align-self: start;
   }
}

&__link {
   grid-area: link;

   &_disabled {
      pointer-events: none;
      opacity: .6;
   }
}

&__image {
   @media (max-width:$mobileSmall){
      width: toRem(122); 
   }
}

&__price {
   grid-area: price;
   font-weight: 600;
   color: var(--primary-color);
}

&__controls {
   grid-area: controls;
   display: flex;
   align-items: center;
   column-gap: toEm(12);
   color: var(--color);

   @media (max-width:$tablet){
   overflow: hidden;
   border: toEm(2) solid var(--bg);
   border-radius: toRem(25);
   }

   @media (max-width: toEm(639.98)){
      justify-self: end;
   }
}

&__remove-from-cart {
   grid-area: remove;
}
}
</style>
