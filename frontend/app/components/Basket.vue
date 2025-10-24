<script setup lang="ts">
import { cartTranslations } from '~/locales/cart'

const { currentLocale } = useLocale()
const cartStore = useCartStore()

onMounted(() => {
  cartStore.loadCart();
})
</script>

<template>
<div >
<NuxtLink
class="cart-link"
   :to="`/${currentLocale}/cartshopping`"
   :aria-label="cartTranslations[currentLocale].ariaLabelBasket"
   >
   <span class="cart-link__price">{{ cartStore.totalItems }}</span>
   <Icon
   name="cil:cart"
   width="30"
   height="30"
   />
</NuxtLink>
</div>
</template>

<style lang="scss" scoped>
   .cart-link {
      position: relative;

      svg {
         color: var(--primary-color);
         transition: transform var(--transition-duration);

         @include hover {
            transform: scale(1.2);
         }
      }

      &__price {
         display: flex;
         justify-content: center;
         align-items: center;
         padding-inline: toRem(4);
         padding-block: toRem(1);
         position: absolute;
         top: toRem(-27);
         right: toRem(-7);
         font-weight: 500;
         border-radius: 50%;
         color: var(--light-color);
         background-color: var(--danger-color);
         transition: transform var(--transition-duration);

         @include hover {
            transform: scale(1.2);
         }
      }
   }

</style>