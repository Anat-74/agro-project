<script setup lang="ts">
import type { Product } from "@/types/types"
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
import { formatPrice } from '~/utils/formatPrice'
import { buttonTranslations } from '~/locales/button'

const { find } = useStrapi()
const route = useRoute()
const cartStore = useCartStore()
const { isInCart } = useIsInCart()
const config = useRuntimeConfig()
const { categorySlug, subcategorySlug, productSlug } = route.params as {
  categorySlug: string
  subcategorySlug: string
  productSlug: string
}
const { currentLocale } = useLocale()
const { goBack } = useGoToForwardOrBack()


const currentImage = ref('')

const { data: product, error, pending } = useAsyncData
   (`product-${currentLocale.value}-${productSlug}`,
   async () => {
    const response = await find<Product>('products', {
       filters: {
          slug: { $eq: productSlug },
          locale: currentLocale.value
       },
       populate: {
        image: {
          fields: ["id", "alternativeText", "url"]
        }
      }
    })

    if (!response.data || response.data.length === 0) {
       throw createError({
          statusCode: 404,
          message: 'Product Not Found'
       })
  }

     const productData = response.data[0]
     const firstImage = productData?.image?.[0]?.url

     if (firstImage) {
      currentImage.value = `${config.public.strapi.url}${firstImage}`
    }
      return productData
   })


const isActive = (imgUrl: string) => 
  currentImage.value === `${config.public.strapi.url}${imgUrl}`

  const characteristics = computed(() => {
  try {
    return JSON.parse(product.value?.characteristics || '[]')
  } catch {
    return []
  }
  })

  useSeoMeta({
  title: product.value?.name,
  description: product.value?.description
})


watch(() => product.value, (newProduct) => {
  if (newProduct?.image?.[0]?.url) {
    currentImage.value = `${config.public.strapi.url}${newProduct.image[0].url}`
    
    // Обновляем SEO метаданные
    useSeoMeta({
      title: newProduct.name,
      description: newProduct.description
    })
  }
}, { immediate: true })

const setCurrentImage = (imgUrl: string) => {
  currentImage.value = `${config.public.strapi.url}${imgUrl}`
}

const handleAddToCart = (product: Product) => {
  cartStore.addToCart(
    product,
    categorySlug,
    subcategorySlug
  )
}
</script> 

<template>
   <Loader v-if="pending"
     class="loader"
   />
   <section 
   v-if="product"
   aria-labelledby="product-description"
   class="product-review"
   >
   <h1
      class="visually-hidden"
      id="product-description"
      >{{ visuallyHiddenTranslations[currentLocale].sectionProductSlugTitle }}</h1>
   <div class="product-review__wrapper-left wrapper-left">
      <div class="wrapper-left__row-top">
      <UButton
      class="wrapper-left__go-back"
      @click="goBack"
      icon="material-symbols:arrow-back"
      :aria-label="buttonTranslations[currentLocale].ariaLabelGoBack"
      name-class="go-forward-back"
     />
     <Icon 
      v-if="product.isDiscount"
      class="wrapper-left__discount-icon"
      name="mdi:discount" />
     <ProductStatus 
      :product="product"
      class="wrapper-left__in-stock"
     />
     <ShareButton 
     class="wrapper-left__share" />
   </div>
        <NuxtImg 
          v-if="currentImage"
          :src="currentImage"
          :alt="product.name"
          format="webp"
          decoding="async"
          width="580"
          height="436"
          class="wrapper-left__image"
        />
     <ul
      v-if="product.image?.length"
     class="wrapper-left__thumbnails"
     >
     <li
        v-for="(img, index) in product.image" 
        :key="img.id"
        :class="['wrapper-left__thumbnail', {'wrapper-left__thumbnail_active': isActive(img.url)}]"
      @mouseover="setCurrentImage(img.url)"
      @click="setCurrentImage(img.url)"
      >
        <NuxtImg
         :src="`${config.public.strapi.url}${img.url}`"
          :alt="`${product.name} - Image ${index + 1}`"
          format="webp"
          decoding="async"
          width="133"
          height="100"
          class="wrapper-left__thumbnail-image"
        />
      </li>
     </ul>
   </div>
   <div class="product-review__wrapper-right wrapper-right">
      <h2 
      class="wrapper-right__title"
      >{{ product.name }}</h2>
      <MDC 
      class="wrapper-right__description"
      :value="product.description" 
      />
      <ProductCharacteristics 
      :specs="characteristics" 
       class="wrapper-right__characteristics"
      />
     <span
      :class="['wrapper-right__price', {'wrapper-right__price_discount' :product.isDiscount}]"
     >
      <Icon 
      :class="{ 'wrapper-right__discount-icon' :product.isDiscount}"
      name="my-icon:icon-by-regular" />
      {{ formatPrice(product.price) }}
     </span>
     <UButton
      v-if="!isInCart(product.id)"
     @click="handleAddToCart(product)"
      name-class="add-to-cart"
      :label="buttonTranslations[currentLocale].label"
      class="wrapper-right__btn"
     />
     <UButton class="subcategory-products__add-to-cart"
      v-else
      disabled
      name-class="add-to-cart"
      icon="emojione-v1:left-check-mark"
      :aira-label="buttonTranslations[currentLocale].ariaLabelAdded"
      />
   </div>
</section>
   <span v-else-if="error">
      Error: {{ error.message }}
   </span>
 </template>

 <style lang="scss" scoped>
.product-review {
   display: grid;
   grid-template-columns: auto minmax(toRem(190), toRem(1220));
   column-gap: toEm(24);
   padding-block: toEm(18);

   @media (max-width:$tablet){
      grid-template-columns: 1fr;
      justify-items: center;
      row-gap: toEm(16);
   }
}

.wrapper-left {
   width: 100%;
   display: flex;
   flex-direction: column;
   row-gap: toEm(16);

   &__row-top {
   display: grid;
   grid-template-columns: 1fr repeat(2, auto);
   align-items: center;
   column-gap: toEm(16);
   grid-auto-flow: column;
   margin-block-end: toEm(7);
   }

   &__go-back {
   justify-self: start;
   }

   &__discount-icon {
   color: var(--lime-color);
   font-size: toEm(32);
}

   &__in-stock {
   padding-inline: toEm(8);
   padding-block: toEm(4);
   border-radius: toRem(4);
   background-color: var(--bg);
   box-shadow: 0px 1px toRem(5) var(--shadow);
}

   &__image {
   align-self: center;
   border-radius: toEm(8);
   box-shadow: 0 0 toRem(4) var(--shadow);
   margin-block-end: toEm(18);
   background-color: var(--bg-product);
//    transition: opacity .2s ease-in-out;
  
//   &:not([src]) {
//     opacity: 0;
//   }

   @media (max-width:$tablet){
      margin-block-end: 0;
   }
}

&__thumbnails {
   display: flex;
   align-items: center;
   justify-content: center;
   gap: toEm(10);

   @media (max-width:$tablet){
      margin-block-end: toEm(22);;
   }
}

&__thumbnail {
  cursor: pointer;
  border: toRem(2) solid transparent;
  border-radius: toRem(4);
  box-shadow: 0px 1px toRem(5) var(--shadow);
  transition: all var(--transition-duration);

   &_active {
      border-color: var(--blue-color);
   }

   @include hover {
      scale: .9;
   }
}

&__thumbnail-image {
   border-radius: toRem(4);
   background-color: var(--bg-product);
   transition: opacity var(--transition-duration);
}
}

.wrapper-right {
   display: grid;
   align-items: center;
   grid-template-columns: 1fr auto;
   row-gap: toEm(12);
   grid-template-areas: 
   'title title'
   'descr descr'
   'charact charact'
   'price btn'
   ;

&__title {
   grid-area: title;
   justify-self: start;
   padding-inline: toEm(8, 22);
   padding-block: toEm(4, 22);
   border-radius: toEm(4, 22);
   color: var(--dark-golden-color);
   background-color: var(--bg-product);
   box-shadow: 0px 1px toRem(5) var(--shadow);
}

&:deep(.wrapper-right__description) {
   grid-area: descr;
   padding-inline: toEm(8);
   padding-block-start: toEm(16);
   padding-block-end: toEm(2);
   border-radius: toRem(4);
   background-color: var(--bg-product);
   box-shadow: 0px 1px toRem(5) var(--shadow);
}

&:deep(.wrapper-right__characteristics) {
   grid-area: charact;
}

&__discount-icon {
   color: var(--green-color);
}

&__price {
   grid-area: price;
   font-weight: 600;
   justify-self: start;
   padding-inline: toEm(8);
   padding-block: toEm(4);
   border-radius: toRem(4);
   color: var(--dark-golden-color);
   background-color: var(--bg-product);
   box-shadow: 0px 1px toRem(5) var(--shadow);

   &_discount {
      color: var(--green-color);
   }
}

&__btn {
   grid-area: btn;
}
}
</style>