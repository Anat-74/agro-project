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
          height="400"
          type="content"
        />
        </div>
      </div>
   </section>
</template>

<style lang="scss" scoped>
.sale-products {
   padding-block-end: toEm(55);

   &__container {
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      column-gap: toEm(27);
      padding-block-start: toEm(55);
   }

   &__title {
      position: absolute;
      left: toEm(9);
      top: toRem(1);
   }

   &__card-list {
      row-gap: toEm(25);
      column-gap: toEm(12);
      @include gridCards;
   }

   &__sale-items {
      position: relative;
   }

   &__hot-sale {
      width: 100%;
      position: absolute;
      z-index: 20;
      top: toRem(70);
      left: 50%;
      translate: -50% 0;
   }

   &__discount-text {
      text-align: center;
      padding-inline: toEm(42);
      margin-block-end: toEm(25);
      font-size: toRem(20);

      span {
         font-weight: 600;
      }
   }

   &__link {
      display: flex;
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