<script setup lang="ts">
import type { Product, PaginationMeta } from "../../types/types"
import type { LocaleCode } from '../../types/types'
import { cartTranslations } from '~/locales/cart'
import { orderSuccessTranslations } from '~/locales/orderSuccess'
import { discountProductTranslations } from '~/locales/discountProduct'
import { formatPrice } from '~/utils/formatPrice'

const { currentLocale } = useLocale()
const cartStore = useCartStore()
const { goBack } = useGoToForwardOrBack()
const { find } = useStrapi()
const config = useRuntimeConfig()

useSeoMeta({
  title: cartTranslations[currentLocale.value as LocaleCode].title,
  ogTitle: cartTranslations[currentLocale.value as LocaleCode].title,
  description: cartTranslations[currentLocale.value as LocaleCode].description,
  ogDescription: cartTranslations[currentLocale.value as LocaleCode].description
})

const { data: product } = useAsyncData(
  `product-discount-${currentLocale.value}`,
  async () => {
     const response = await find<Product>('products', {
       filters: {
         locale: currentLocale.value,
         isDiscount: true,
       },
       pagination: {
        pageSize: 100
      } as PaginationMeta,
        populate: {
         image: {
          fields: ["alternativeText", "url"]
        },
         subcategory: {
         fields: ['name', 'slug'],
         populate: {
            category: {
               fields: ['name', 'slug'],
               }
            }
         }
      }
    })


    if (!response.data || response.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product - Not Found'
      })
     }
    return response.data
   }
)

// Добавляем состояние для сообщения об успехе
const showOrderSuccess = ref(false)

const successTitle = ref('')
const successNotice = ref('')
const successThanks = ref('')

const handleOrderSuccess = (orderId: number) => {
  const translations = orderSuccessTranslations[currentLocale.value]
  successTitle.value = translations.title.replace('{orderId}', orderId.toString())
  successNotice.value = translations.notice
  successThanks.value = translations.thanks
  
  showOrderSuccess.value = true

  setTimeout(() => {
    showOrderSuccess.value = false
  }, 7000)
}

onMounted(() => {
  cartStore.loadCart()
})
</script>

<template>
   <section 
   :class="['cart-page', {'cart-page_empty' : cartStore.totalItems === 0}]"
   aria-labelledby="cart-page"
   >
   <h1
   class="visually-hidden"
   id="cart-page"
   >{{ cartTranslations[currentLocale].visuallyHidden }}</h1>

   <UButton
      @click="goBack"
      icon="material-symbols:arrow-back"
      aria-label="go back"
      name-class="go-forward-back"
      class="cart-page__go-back"
     />
     <div 
       v-if="cartStore.totalItems === 0"
       class="cart-page__cart-empty cart-empty"
     >
     <div class="cart-empty__body" >
      <ul class="cart-empty__list">
         <li class="cart-empty__item">
         <NuxtImg
         src="/image/valberg_new-removebg-preview.png"
         alt="image"
         decoding="async"
         width="122"
       />
         </li>
         <li class="cart-empty__item">
         <NuxtImg
         src="/image/aiko_new_1-removebg-preview.png"
         alt="image"
         format="webp"
         width="122"
       />
         </li>
         <li class="cart-empty__item">
         <NuxtImg
         src="/image/praktik_profi_rgb-removebg-preview.png"
         alt="image"
         format="webp"
         width="122"
       />
         </li>
         <li class="cart-empty__item">
         <NuxtImg
         src="/image/praktik-home_rgb-removebg-preview.png"
         alt="image"
         format="webp"
         width="122"
       />
         </li>
      </ul>
     </div>
     <div class="cart-empty__image">
       <NuxtImg 
         src="/image/cart-empty-img.png"
         alt="image"
         format="webp"
         width="286"
         height="144"
       />
       <span class="cart-empty__text">{{ cartTranslations[currentLocale].cartEmpty }}</span>
      </div>
     </div>

     <div class="cart-page__body">
     <div class="cart-page__cart-items">
      <h2 class="cart-page__title">
         {{ cartTranslations[currentLocale].title }}
         </h2>
         <span 
         aria-atomic="true"
         aria-live="polite"
         role="status"
         class="cart-page__total">
         {{ cartTranslations[currentLocale].total }}
            <b>{{ cartStore.totalItems }}</b>
         </span>

           <CartShopping
           class="cart-page__products"
           />

            <ul v-if="cartStore.totalItems === 0"
            class="cart-page__discount-card discount-card"
            >
            <li class="discount-card__item"
               v-for="prod in product"
               :key="prod.id"
               >
               <span class="discount-card__promotional">
           <Icon
           name="mdi:discount-outline" />
           {{ discountProductTranslations[currentLocale].discount }}
         </span>
               <ProductStatus 
                :product="prod"
                class="discount-card__in-stock"
               />
               <NuxtLink
               class="discount-card__link"
                  :to="`/${currentLocale}/${prod?.subcategory?.category?.slug}/${prod?.subcategory?.slug}/${prod.slug}`"
                  >
                  <NuxtImg
                  class="discount-card__image"
                     v-if="prod.image?.length"
                     :src="`${config.public.strapi.url}${prod.image[0]?.url}`"
                     :alt="prod.name"
                     loading="lazy"
                     decoding="async"
                     width="240"
                     height="180"
                     format="webp"
                   />
            </NuxtLink>
            <h3 class="discount-card__title">{{ prod.name }}</h3>
            <span class="discount-card__price">{{ formatPrice(prod.price) }}</span>
         </li>
      </ul>
            <AppNotification
            v-if="showOrderSuccess"
            type="success"
            @close="showOrderSuccess = false"
            >
            <div>
            <p>{{ successTitle }}</p>
            <p>{{ successNotice }}</p>
            <p>{{ successThanks }}</p>
         </div>
         </AppNotification>
         </div>
         <OrderForm 
         class="cart-page__order-form"
         @order-success="handleOrderSuccess"
         />
         </div>
   </section>
 </template>

<style lang="scss" scoped>
.cart-empty {
   display: grid;
   grid-template-columns: 1fr auto;
   align-items: center;
   padding-block-start: toEm(58);

   &__body {
      min-height: 100%;
      display: grid;
      align-items: center;
      padding-inline: toEm(18);
      padding-block: toEm(12);
      border-radius: toRem(6) toRem(6) 0 0;
      background-color: var(--secondary-color);
      box-shadow:
      0px 4px 4px 5px rgba(30, 33, 44, 0.05),
      0px 12px 10px -9px rgba(30, 33, 44, 0.08),
      0px 26px 24px -120px rgba(30, 33, 44, 0.1),
      0px 30px 0px -99px rgba(30, 33, 44, 0.16);
   }

   &__list {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      justify-items: center;
      align-items: center;
      column-gap: toEm(18);
      row-gap: toEm(12);
      padding-inline: toEm(9);
      padding-block: toEm(12);
      border-radius: toRem(4);
      background-color: var(--bg);

      @media (max-width:toEm(530)){
         grid-template-columns: repeat(2, 1fr);
      }
   }

   &__item {
      padding-inline: toEm(4);
      border-radius: toRem(4);
      background-color: var(--light-color);

         &:not(:first-child) {
            padding-block: toEm(6);
         }

         @media (max-width:$mobile){
            max-width: toRem(99); 
         }
   }

   &__image {
      display: grid;
      justify-items: center;

      @media (max-width:$tablet){
         display: none;
      }
   }

   &__text {
      font-size: toEm(22);
      font-weight: 600;
      letter-spacing: toRem(1.2);
      font-family: $font-family2;
      color: var(--warning-color);
   }
}

.cart-page {
   position: relative;

   &_empty {
      .cart-page__body {
      padding-block-start: toEm(12);
      }

      .cart-page__cart-items {
         border-radius: 0 0 toRem(6) toRem(6);
      }
   }

&__go-back {
   position: absolute;
   top: toRem(12);
   left: 0;
}

&__body {
   display: grid;
   grid-template-columns: 1fr auto;
   column-gap: toEm(22);
   padding-block-start: toEm(58);
   padding-block-end: toEm(32);

   @media (max-width:$tablet){
      grid-template-columns: 1fr;
      row-gap: toEm(32);
      column-gap: 0;
   }
}

&__cart-items {
   padding-inline: toEm(16);
   padding-block: toEm(16);
   border-radius: toEm(6);
   background-color: var(--secondary-color);
   box-shadow:
      0px 4px 4px -4px rgba(30, 33, 44, 0.05),
      0px 12px 10px -6px rgba(30, 33, 44, 0.08),
      0px 26px 24px -10px rgba(30, 33, 44, 0.1),
      0px 30px 120px -90px rgba(30, 33, 44, 0.16);
}

&__title {
   margin-block-end: toEm(4);
   color: var(--dark-golden-color);
}

&__total {
   display: inline-block;
   margin-block-end: toRem(4);
   color: var(--primary-color);

   b {
      font-size: toEm(18);
      color: var(--gray-color);
   }
}

&__order-form {
   justify-self: end;

   @media (max-width:$mobileSmall){
      justify-self: center;
   }
}
}

.discount-card {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(toRem(262), 1fr));
   justify-items: center;
   gap: toEm(22);

   &__item {
   position: relative;
   justify-self: center;
   display: grid;
   row-gap: toEm(4);
   min-height: 100%;
   width: 100%;
   padding-inline: toEm(12);
   padding-block: toEm(18);
   box-shadow: 0px 1px 2px 0px var(--shadow);
   border-radius: toEm(4);
   background-color: var(--bg);
   }

   &__promotional {
      display: flex;
      align-items: center;
      column-gap: toEm(2);
      font-weight: 600;
      color: var(--warning-color);
   }

   &__in-stock {
      position: absolute;
      top: toEm(18);
      right: toEm(9);
   }

   &__link {
      display: flex;
      justify-content: center;
      transition: scale var(--transition-duration);

      @include hover {
         scale: 1.1;
      }
   }

   &__title {
      text-align: center;
      margin-block-end: toRem(9);
      color: var(--primary-color);
   }

   &__price {
      justify-self: end;
      align-self: center;
      padding-inline: toEm(2);
      font-weight: 600;
      border-radius: toRem(2);
      outline: toRem(1) solid var(--secondary-color);
      outline-offset: toEm(4);
      color: var(--warning-color);
   }
}
</style>