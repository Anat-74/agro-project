<script setup lang="ts">
import { characteristcsTranslations } from '~/locales/productCharacteristics'
const { currentLocale } = useLocale()
const t = computed(() => characteristcsTranslations[currentLocale.value])

interface Characteristic {
  param: string
  value: string
}

defineProps<{
  specs: Characteristic[]
}>()
</script>

<template>
   <div v-if="specs?.length" class="product-characteristics">
     <h3 class="product-characteristics__title">
      {{ t.title }}
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

&__title {
   translate: toRem(2) 0;
   justify-self: start;
   margin-block-end: toEm(6);
   padding-inline: toEm(8);
   padding-block: toEm(4);
   border-radius: toEm(4);
   background-color: var(--whitesmoke-color);
}

&__table {
   width: 100%;
   // border-collapse: collapse;
}

&__row {
   border-bottom: 1px solid var(--light-color);
   background-color: var(--whitesmoke-color);

   &:last-child {
    border-bottom: none;
  }
}

&__param {
   width: 60%;
   padding-inline: toEm(8);
   padding-block: toEm(8);
   font-weight: 600;
}

&__value {
   padding-inline: toEm(8);
}
}

 </style>