<script setup lang="ts">
interface Props {
  saleProd: FeaturedProduct[];
}

const { saleProd } = defineProps<Props>();
</script>

<template>
   <section class="sale-products" aria-labelledby="sale-products">
      <UBackground
        v-if="
         saleProd?.[1]?.backgroundImage?.retinaBgImageAvif?.url ||
          saleProd?.[1]?.backgroundImage?.baseBgImageWebp?.url
        "
        :src="saleProd?.[1].backgroundImage.baseBgImageWebp?.url"
        :retinaSrc="saleProd?.[1].backgroundImage.retinaBgImageAvif?.url"
      />
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
            <p v-if="saleProd?.[1]?.saleText || saleProd?.[1]?.percentDiscount" >
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
      </NuxtLink>
         </div>
       <UImage
          v-if="saleProd?.[1]?.image?.url"
          :src="saleProd?.[1].image.url"
          :alt="saleProd?.[1]?.heading"
          width="260"
          height="380"
          type="content"
        />
        </div>
      </div>
   </section>
</template>

<style lang="scss" scoped>
.sale-products {
   padding-block-start: toEm(26);

   &__container {
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      padding-block-start: toEm(75);
   }

   &__title {
      position: absolute;
      left: toEm(9);
      top: toEm(8);
   }

      &__card-list {
      height: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      row-gap: toEm(12);
      column-gap: toEm(9);
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