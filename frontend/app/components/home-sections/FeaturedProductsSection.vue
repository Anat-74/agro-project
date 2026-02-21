<script setup lang="ts">
interface Props {
  products: FeaturedProduct[];
}

const { products } = defineProps<Props>();

const MAX_PRODUCTS_TO_SHOW = 6;
</script>

<template>
  <section class="featured-products" aria-labelledby="featured-products">
    <div
      v-for="section in products"
      :key="section.id"
      class="featured-products__container"
    >
         <UBackground
        v-if="
          section.backgroundImage?.retinaBgImageAvif?.url ||
          section.backgroundImage?.baseBgImageWebp?.url
        "
        :src="section.backgroundImage?.baseBgImageWebp?.url"
        :retinaSrc="section.backgroundImage?.retinaBgImageAvif?.url"
        bg-position="bottom left"
      />
        <h2
          v-if="section.heading"
          class="featured-products__title"
          id="featured-products"
        >
          {{ section.heading }}
        </h2>
         <NuxtLink v-if="section.link" class="featured-products__link">
          {{ section.link }}
        </NuxtLink>
      <ul class="featured-products__card-list"
      v-if="section.products?.length" 
      >
        <ProductCard
        class="featured-products__item"
          v-for="(prod, index) in section.products.slice(0, MAX_PRODUCTS_TO_SHOW)"
          :key="prod.id"
          :product="prod"
          :index="index"
          :categorySlug="categorySlug"
       /> 
      </ul>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.featured-products {
      position: relative;
      padding-block-start: toEm(144);
      background-color: var(--light-color);

      @media (max-width:$tablet){
      padding-block-start: toEm(8);
      background-color: var(--bg-product);
      }

      &__container {
      position: relative;
      @include adaptiveValue("padding-block", 82, 60);

      @media (max-width:$tablet){
         grid-template-columns: 1fr auto;
         display: grid;
         align-items: center;
         column-gap: toEm(22);
         padding-inline: toRem(12);
         overflow-x: auto;
         scrollbar-width: thin;
         scrollbar-color: yellow transparent;
      }
      }

   &__title {
      position: absolute;
      left: toEm(9);
      top: toEm(12);
   }

   &__link {
      grid-row: 1/2;
      grid-column: 2/3;

      @media (min-width:$tablet){
         position: absolute;
         top: toEm(30);
         right: toEm(15);
      }
   }

   &__card-list {
      display: flex;
      align-items: center;
      column-gap: toEm(18);
   }

   &__item {
      transition: .4s;

      @media (max-width:$tablet){
         width: toEm(218);  
      }
   }
}
</style>
