<script setup lang="ts">
interface Props {
  saleProd: FeaturedProduct[];
}

const { saleProd } = defineProps<Props>();
</script>

<template>
   <section class="sale-products" aria-labelledby="sale-products">
      <!-- <UBackground
        v-if="
         saleProd?.[1]?.backgroundImage?.retinaBgImageAvif?.url ||
          saleProd?.[1]?.backgroundImage?.baseBgImageWebp?.url
        "
        :src="saleProd?.[1].backgroundImage.baseBgImageWebp?.url"
        :retinaSrc="saleProd?.[1].backgroundImage.retinaBgImageAvif?.url"
      /> -->
      <div class="sale-products__container">
      <h2
         v-if="saleProd?.[1]?.heading"
         class="sale-products__title"
         id="sale-products"
        >
          {{ saleProd?.[1].heading }}
        </h2>
      <ul class="sale-products__card-list"
         v-if="saleProd?.[1]?.products?.length" 
      >
       <DiscountProduct 
          v-for="(prod, index) in saleProd?.[1].products"
          :key="prod.id"
          :index="index"
          :product="prod"
       />
      </ul>
      <div class="sale-products__sale-items">
         <div class="sale-products__hot-sale">
            <p class="sale-products__discount-text"
            v-if="saleProd?.[1]?.saleText || saleProd?.[1]?.percentDiscount" >
               <span>
                  {{ saleProd?.[1].percentDiscount }}
               </span>
               {{ saleProd?.[1].saleText }}
            </p>
      <NuxtLink
         class="sale-products__link"
      ><span v-if="saleProd?.[1]?.link">
         {{ saleProd?.[1].link }}
      </span>
         <Icon name="mingcute:arrow-right-line" />
      </NuxtLink>
         </div>
       <UImage
          v-if="saleProd?.[1]?.image?.url"
          :src="saleProd?.[1].image.url"
          :alt="saleProd?.[1]?.heading"
          width="302"
          height="417"
          type="content"
        />
        </div>
      </div>
   </section>
</template>

<style lang="scss" scoped>
.sale-products {
   padding-block-end: toEm(55);
   background-color: var(--light-color);

   @media (max-width:$tablet){
      background-color: var(--whitesmoke-color);
   }

   &__container {
      position: relative;
      padding-block-start: toEm(55);

      @media (min-width:$tablet){
         display: grid;
         grid-template-columns: 1fr auto;
         align-items: center;
         column-gap: toEm(27);
      }
   }

   &__title {
      position: absolute;
      left: toEm(9);
      top: toRem(1);
      font-style: italic;
      font-family: $font-family-cursive;
      color: var(--warning-color);
   }

   &__card-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      row-gap: toEm(25);
      column-gap: toEm(12);
      @include adaptiveValue("row-gap", 25, 18, 0, $containerWidth, 1023.98);

      @media (max-width:$mobile){
          grid-template-columns: repeat(2, 1fr); 
      }
   }

   &__sale-items {
      @media (min-width:$tablet){
         position: relative;
      }

   //    @media (max-width:$tablet){
   //       display: none;
   // }
   }

   &__hot-sale {
      @media (min-width:$tablet){
         width: 100%;
         position: absolute;
         z-index: 20;
         top: toRem(50);
         left: 50%;
         translate: -50% 0;
      }
   }

   &__discount-text {
      text-align: center;
      margin-block-end: toEm(25);
      font-size: toEm(20);
      @include adaptiveValue("padding-inline", 42, 6, 0, $containerWidth, 1023.98);

      span {
         white-space: nowrap;
         font-weight: 600;
      }
   }

   &__link {
      display: flex;
      justify-content: center;
      align-items: center;
      column-gap: toEm(6);
      width: fit-content;
      margin: 0 auto;
      padding-inline: toEm(22);
      padding-block: toEm(12);
      border-radius: toRem(25);
      font-weight: 600;
      color: var(--green-color);
      background-color: var(--light-color);

      svg {
         font-size: toEm(20);
      }
   }
}
</style>