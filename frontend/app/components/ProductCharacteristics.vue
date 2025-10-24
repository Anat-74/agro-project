<script setup lang="ts">
import { characteristcsTranslations } from '~/locales/productCharacteristics'
const { currentLocale } = useLocale()

interface Characteristic {
  param: string
  value: string
}

defineProps({
  specs: {
    type: Array as PropType<Characteristic[]>,
    default: () => []
  }
})
</script>

<template>
   <div v-if="specs?.length" class="product-characteristics">
     <h3 class="product-characteristics__title">
      {{ characteristcsTranslations[currentLocale].title }}
     </h3>
     <table class="product-characteristics__table">
       <tbody>
         <tr 
           v-for="(spec, index) in specs" 
           :key="index"
           class="product-characteristics__row"
         >
           <td class="product-characteristics__param">{{ spec.param }}</td>
           <td class="product-characteristics__value">{{ spec.value }}</td>
         </tr>
       </tbody>
     </table>
   </div>
 </template>
 
 <style lang="scss" scoped>
.product-characteristics {
   margin-block: toEm(16);

&__title {
   translate: toRem(2) 0;
   font-weight: 600;
   justify-self: start;
   margin-block-end: toEm(12, 18);
   padding-inline: toEm(8, 18);
   padding-block: toEm(4, 18);
   border-radius: toEm(4, 18);
   color: var(--dark-golden-color);
   background-color: var(--bg-product);
   box-shadow: 0px 1px toRem(5) var(--shadow);
}

&__table {
   width: 100%;
   border-collapse: collapse;
   box-shadow: 0px 1px toRem(5) var(--shadow);
}

&__row {
   border-bottom: 1px solid var(--shadow);
   background-color: var(--bg-product);

   &:last-child {
    border-bottom: none;
  }
}

&__param {
   width: 60%;
   padding-inline: toEm(7);
   padding-block: toEm(12);
   font-weight: 600;
}

&__value {
   padding-inline-start: toEm(5);
}
}

 </style>