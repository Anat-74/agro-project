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
         v-if="section?.heading"
         class="featured-products__title"
         id="featured-products"
        >
          {{ section.heading }}
        </h2>
      <div class="featured-products__items">
         <NuxtLink v-if="section.link" class="featured-products__link">
            <span>{{ section.link }}</span>
             <Icon name="mingcute:arrow-right-line" />
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
    </div>
  </section>
</template>

<style lang="scss" scoped>
.featured-products {
      background-color: var(--light-color);

      @media (max-width:$tablet){
      padding-block-start: toEm(24);
      background-color: var(--bg-product);
      }

      &__container {
      position: relative;
      }

   &__title {
      position: absolute;
      left: toRem(15);
      top: toEm(14);

      @media (max-width:$tablet){
         top: toEm(9);
      }
   }

      &__items {
         @include adaptiveValue("padding-block", 82, 54);

      @media (max-width:$tablet){
         grid-template-columns: 1fr auto;
         display: grid;
         column-gap: toEm(16);
         padding-inline: toRem(5);
         overflow-x: auto;
         scrollbar-width: thin;
         scrollbar-color: yellow transparent;
      }
   }

   &__link {
      display: flex;
      align-items: center;
      column-gap: toEm(4);

      svg {
         font-size: toEm(22);
      }

      @media (min-width:$tablet){
         height: auto;
         position: absolute;
         top: toEm(30);
         right: toEm(15);
         font-weight: 600;
         color: var(--green-color);
      }

      @media (max-width:$tablet){
      grid-row: 1/2;
      grid-column: 2/3;
      flex-direction: column;
      row-gap: toEm(4);
      justify-content: center;
      text-align: center;
      height: 100%;
      padding-inline: toEm(12);
      border-radius: toEm(6);
      color: var(--light-color);
      background-color: var(--green-color);
      }
   }

   &__card-list {
      display: flex;
      align-items: center;
      justify-content: space-between;
      column-gap: toEm(12);
   }

   &__item {
      transition: all .4s;
      @include adaptiveValue("height", 385, 322);

      @media ($tablet <= width <= toEm(1425)){
         &:last-child {
            display: none;
         }
      }

      @media (max-width:$tablet){
         width: toEm(216);
      }
   }
}
</style>
