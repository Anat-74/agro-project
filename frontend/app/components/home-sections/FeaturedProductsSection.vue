<script setup lang="ts">
interface Props {
  featuredProd: FeaturedProduct[];
}

const { featuredProd } = defineProps<Props>();

const MAX_PRODUCTS_TO_SHOW = 6;
</script>

<template>
  <section class="featured-products" aria-labelledby="featured-products">
      <UBackground
        v-if="
         featuredProd?.[0]?.backgroundImage?.retinaBgImageAvif?.url ||
          featuredProd?.[0]?.backgroundImage?.baseBgImageWebp?.url
        "
        :src="featuredProd?.[0].backgroundImage.baseBgImageWebp?.url"
        :retinaSrc="featuredProd?.[0].backgroundImage.retinaBgImageAvif?.url"
        bg-position="bottom left"
        sizeMode="contain"
        filter="brightness"
      />

    <div class="featured-products__container"
    >
         <h2
         v-if="featuredProd?.[0]?.heading"
         class="featured-products__title"
         id="featured-products"
        >
          {{ featuredProd?.[0].heading }}
        </h2>
      <div class="featured-products__items">
         <div class="featured-products__link"
         v-if="featuredProd?.[0]?.link" 
         >
             <span>{{ featuredProd?.[0].link }}</span>
              <Icon name="mingcute:arrow-right-line" />
         </div>
      <ul class="featured-products__card-list"
      v-if="featuredProd?.[0]?.products?.length" 
      >
        <ProductCard
        class="featured-products__item"
          v-for="(prod, index) in featuredProd?.[0].products.slice(0, MAX_PRODUCTS_TO_SHOW)"
           :key="prod.documentId"
          :product="prod"
          :index="index"
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
      padding-block-start: toEm(40);
      background-color: var(--whitesmoke-color);
      }

      &__container {
      position: relative;
      }

   &__title {
      position: absolute;
      left: toRem(15);
      top: toEm(-2);
   }

      &__items {
         padding-block: toEm(50);

      @media (max-width:$tablet){
         grid-template-columns: 1fr auto;
          display: grid;
          column-gap: toEm(16);
          padding-inline: toRem(5);
          overflow-x: auto;
          > * { min-width: 0; }
         scrollbar-width: thin;
         scrollbar-color: var(--light-color) var(--light-color);
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
         top: toEm(7);
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
      max-width: toRem(220);
      transition: all .5s;
      @include adaptiveValue("height", 350, 300);

      @media ($tablet <= width <= toEm(1250)){
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
