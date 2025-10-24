<script setup lang="ts">
import type { Product } from "@/types/types"

const route = useRoute()
const { currentLocale } = useLocale()

const props = defineProps<{
   product: Product & {
      category?: {
        slug: string
      }
      subcategory?: {
      slug: string
    }
  }
}>()

const categorySlug = computed(() => {
  return (route.params.categorySlug as string) 
    || props.product.subcategory?.category?.slug 
    || 'category'
})

const subcategorySlug = computed(() => {
  return (route.params.subcategorySlug as string)
    || props.product.subcategory?.slug
    || 'subcategory'
})
</script>

<template>
      <li class="product-card">
  <NuxtLink
    :to="`/${currentLocale}/${categorySlug}/${subcategorySlug}/${product.slug}`"
    class="product-card__link"
  >
  <h2 class="product-card__title">{{ product.name }}</h2>
  </NuxtLink>
   </li>
</template>

<style lang="scss" scoped>
.product-card {
   margin-block-end: toRem(12);

&__title {
   color: var(--color);
   font-size: toEm(16);
}
}

</style>