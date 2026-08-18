<script setup lang="ts">
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
import { buttonTranslations } from '~/locales/button'
import { tooltipTranslations } from '~/locales/tooltip'

const { find } = useStrapi()
const route = useRoute()
const cartStore = useCartStore()
const { isInCart } = useIsInCart()
const config = useRuntimeConfig()
const { categorySlug, productSlug } = route.params as {
  categorySlug: string
 productSlug: string
}
const { currentLocale } = useLocale()
const visuallyHiddenT = computed(() => visuallyHiddenTranslations[currentLocale.value])
const buttonT = computed(() => buttonTranslations[currentLocale.value])
const tooltipT = computed(() => tooltipTranslations[currentLocale.value])
const { goBack } = useGoToForwardOrBack()

const { data: product, error, pending } = useCachedAsyncData(
   `product-${currentLocale.value}-${productSlug}`,
   async () => {
    const response = await find<Product>('products', {
       locale: currentLocale.value,
       filters: {
          slug: { $eq: productSlug },
       },
       populate: {
        image: {
          fields: ["id", "alternativeText", "url"]
        },
        seo: {
          fields: ["metaTitle", "metaDescription", "structuredData"]
        },
        seoImage: {
          fields: ["id", "alternativeText", "url"]
        }
      }
    } as any)

    if (!response.data || response.data.length === 0) {
       throw createError({
          statusCode: 404,
          message: 'Product Not Found'
       })
 }

      return response.data[0]
   },
   { ttl: 300_000 })


 const characteristics = computed(() => {
  try {
    return JSON.parse(product.value?.characteristics || '[]')
  } catch {
    return []
  }
  })

  useSeoMeta({
    title: product.value?.seoTitle || product.value?.seo?.metaTitle || product.value?.name,
    description: product.value?.seoDescription || product.value?.seo?.metaDescription || product.value?.description,
    ogTitle: product.value?.seoTitle || product.value?.seo?.metaTitle || product.value?.name,
    ogDescription: product.value?.seoDescription || product.value?.seo?.metaDescription || product.value?.description,
    ogImage: product.value?.seoImage?.[0]?.url
      ? `${config.public.strapi.url}${product.value.seoImage[0].url}`
      : product.value?.image?.[0]?.url
        ? `${config.public.strapi.url}${product.value.image[0].url}`
        : `${config.public.siteUrl}/default-product-image.jpg`,
    ogUrl: `${config.public.siteUrl}${route.fullPath}`
  })
  
  // Добавляем structured data в useHead
  useHead({
    script: product.value?.seo?.structuredData ? [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify(product.value.seo.structuredData)
    }] : []
  })


watch(() => product.value, (newProduct) => {
   if (newProduct?.image?.[0]?.url) {
      // Обновляем SEO метаданные
      useSeoMeta({
       title: newProduct?.seoTitle || newProduct?.seo?.metaTitle || newProduct?.name,
       description: newProduct?.seoDescription || newProduct?.seo?.metaDescription || newProduct?.description,
       ogTitle: newProduct?.seoTitle || newProduct?.seo?.metaTitle || newProduct?.name,
       ogDescription: newProduct?.seoDescription || newProduct?.seo?.metaDescription || newProduct?.description,
       ogImage: newProduct?.seoImage?.[0]?.url
         ? `${config.public.strapi.url}${newProduct.seoImage[0].url}`
         : newProduct?.image?.[0]?.url
           ? `${config.public.strapi.url}${newProduct.image[0].url}`
           : `${config.public.siteUrl}/default-product-image.jpg`,
       ogUrl: `${config.public.siteUrl}${route.fullPath}`
     })
   }
 }, { immediate: true })

const handleAddToCart = (product: Product) => {
  cartStore.addToCart(
    product,
    categorySlug,
    null // subcategorySlug - null, так как продукт принадлежит напрямую категории
  )
}
</script> 

<template>
  <div>
   <ULoader
v-if="pending"
     class="loader"
   />
   <section 
   v-if="product"
   aria-labelledby="product-description"
   class="product-review product-review__container"
   >
   <h1
      id="product-description"
      class="visually-hidden"
      >{{ visuallyHiddenT.sectionProductSlugTitle }}</h1>
    <div class="product-review__wrapper-left wrapper-left">
      <header
       class="wrapper-left__row-top"
       :aria-label="visuallyHiddenT.productPageHeader"
      >
      <UButton
      class="wrapper-left__go-back"
      icon="material-symbols:arrow-back"
      :aria-label="buttonT.ariaLabelGoBack"
      variant="go-forward-back"
      @click="goBack"
     />
     <Icon 
      v-if="product.isDiscount"
      class="wrapper-left__discount-icon"
      name="mdi:discount" />
     <ProductStatus 
      :product="product"
      class="wrapper-left__in-stock"
     />
     <ShareButton />
   </header>
        <UProductGallery :product="product" />
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
      <UTooltip 
      :text="tooltipT.byRuble"
      >
        <Icon name="my-icon:icon-by-regular" />
      </UTooltip>
      {{ formatPrice(product.price) }}
     </span>
     <UButton
      :disabled="isInCart(product.documentId)"
       @click="handleAddToCart(product)"
      >
      {{ isInCart(product.documentId) ? buttonT.addedIsCart : buttonT.label }}
     </UButton>
   </div>
 </section>
   <span v-else-if="error">
      Error: {{ error.message }}
   </span>
  </div>
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
    color: var(--success-color);
    font-size: toEm(32);
 }

    &__in-stock {
    padding-inline: toEm(8);
    padding-block: toEm(4);
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
 }

 &:deep(.wrapper-right__description) {
    grid-area: descr;
    padding-inline: toEm(8);
    padding-block-start: toEm(16);
    padding-block-end: toEm(2);
    border-radius: toRem(4);
    // Минимальная высота описания: короткие описания не оставляют большой пустой
    // отступ под кнопкой (длинные не затрагиваются)
    min-height: toEm(130);
    line-height: 1.5;
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
    color: var(--green-color);

    &_discount {
       color: var(--green-color);
    }
 }

 &__btn {
    grid-area: btn;
 }
 }
 </style>