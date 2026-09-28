<script setup lang="ts">
import { characteristcsTranslations } from '~/locales/productCharacteristics'
const { currentLocale } = useLocale()
const t = computed(() => characteristcsTranslations[currentLocale.value])

interface Characteristic {
  param: string
  value: string
}

const props = defineProps<{
  specs: Characteristic[]
}>()

// Строки для единой таблицы «подпись → значение» (UValueTable)
const rows = computed(() =>
  props.specs.map((spec) => ({ label: spec.param, value: spec.value })),
)
</script>

<template>
   <div v-if="props.specs?.length" class="product-characteristics">
     <h3 class="product-characteristics__title">
      {{ t.title }}
     </h3>
     <UValueTable :rows="rows" :caption="t.title" />
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
}

 </style>