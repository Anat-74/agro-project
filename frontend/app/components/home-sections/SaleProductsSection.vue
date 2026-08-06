<script setup lang="ts">
interface Props {
  saleProd: FeaturedProduct[];
}

const { saleProd } = defineProps<Props>();
</script>

<template>
   <section class="sale-products" aria-labelledby="sale-products">
      <div class="sale-products__container">
      <h2
         id="sale-products"
         class="sale-products__title"
        > {{ saleProd?.[1]?.heading }}
        </h2>
      <ul
v-if="saleProd?.[1]?.products?.length"
         class="sale-products__card-list" 
      >
       <DiscountProduct
          v-for="(prod, index) in saleProd?.[1].products"
           :key="prod.documentId"
          :index="index"
          :product="prod"
       />
      </ul>
      <div class="sale-products__sale-items">
         <div class="sale-products__hot-sale">
            <div
v-if="saleProd?.[1]?.saleText || saleProd?.[1]?.percentDiscount"
               class="sale-products__items-text"
            >
             <p
v-if="saleProd?.[1]?.saleText || saleProd?.[1]?.percentDiscount"
                class="sale-products__discount-text"
             >
                <span>
                   {{ saleProd?.[1].percentDiscount }}
                </span>
                {{ saleProd?.[1].saleText }}
             </p>
                <p
class="sale-products__discount-text visible-tablet"
                aria-hidden="true"
                >
                <span>
                   {{ saleProd?.[1].percentDiscount }}
                </span>
                {{ saleProd?.[1].saleText }}
             </p>
                <p
class="sale-products__discount-text visible-tablet"
                aria-hidden="true"
                >
                <span>
                   {{ saleProd?.[1].percentDiscount }}
                </span>
                {{ saleProd?.[1].saleText }}
             </p>
            </div>
               <div
                  class="sale-products__link"
               ><span v-if="saleProd?.[1]?.link">
                  {{ saleProd?.[1].link }}
               </span>
                  <Icon name="mingcute:arrow-right-line" />
               </div>
         </div>
        <UImage
          v-if="saleProd?.[1]?.image?.url"
          :src="saleProd?.[1].image.url"
          :alt="saleProd?.[1]?.heading"
          width="302"
          height="417"
          type="product"
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
         > * { min-width: 0; }
      }

      @media (max-width:$mobileSmall){
         padding-block-start: toEm(80);
      }
   }

   &__title {
      position: absolute;
      left: toEm(9);
      top: toRem(1);
      font-style: italic;
      font-family: $font-family-cursive;
      color: var(--danger-hover);
   }

   &__card-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      row-gap: toEm(25);
      column-gap: toEm(12);
      > * { min-width: 0; }
      @include adaptiveValue("row-gap", 25, 18, 0, $containerWidth, 1023.98);

      @media (max-width:toEm(800)){
          grid-template-columns: repeat(2, 1fr); 
      }
   }

   &__sale-items {
      @media (min-width:$tablet){
         position: relative;
      }
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

   &__items-text {
      @media (max-width:$tablet){
         position: absolute;
         top: toEm(16);
         right: toRem(18);
         display: flex;
         align-items: center;
         white-space: nowrap;
         overflow-x: auto;
         width: 45%;

         &::-webkit-scrollbar {
            display: none;
         }
         -ms-overflow-style: none;
         scrollbar-width: none;
      }

      @media (max-width:$mobile){
         top: toEm(18);
      }

      @media (max-width:$mobileSmall){
         top: toEm(40);
         width: 94%;
         left: 50%;
         translate: -50% 0;
         background-color: var(--light-color);
      }
   }
   &__discount-text {
      text-align: center;
      font-size: toEm(18);
      @include adaptiveValue("padding-inline", 42, 6, 0, $containerWidth, 1023.98);

      @media (min-width:$tablet){
         margin-block-end: toEm(32);
      }

      @media (max-width:$tablet){
         padding-block: toEm(4);
         color: var(--warning-hover);
         animation: scroll 9s infinite linear;
         @include adaptiveValue("padding-inline-end", 32, 90);
      }

      span {
         white-space: nowrap;
         font-weight: 600;
         color: var(--danger-hover);

         @media (max-width:$tablet){
            color: var(--warning-color);
         }
      }
   }

   &__link {
      display: flex;
      justify-content: center;
      align-items: center;
      column-gap: toEm(6);
      width: fit-content;
      padding-inline: toEm(22);
      padding-block: toEm(12);
      border-radius: toRem(25);
      font-weight: 600;
      color: var(--green-color);
      background-color: var(--light-color);

      @media (min-width:$tablet){
         margin-inline: auto;
      }

      @media (max-width:$tablet){
         margin-inline-start: auto;
         margin-block-start: toEm(27);
      }

      svg {
         font-size: toEm(20);
      }
   }
}

@keyframes scroll {
   0% {
      translate: 0;
   }
   100% {
      translate: -100%;
   }

  // Анимации для custom-темы
  @container style(--theme: custom) {
    animation: cardEntrance 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    opacity: 0;
  }

}
</style>