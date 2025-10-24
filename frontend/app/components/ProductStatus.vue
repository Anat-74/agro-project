<script setup lang="ts">
import { stockStatusTranslations } from '~/locales/stockStatus';

const { currentLocale } = useLocale()
const { product } = defineProps<{
  product: {
    isAvailable?: boolean
  }
}>()

</script>

<template>
  <span 
    :class="{
      'in-stock': product.isAvailable,
      'to-order': !product.isAvailable
    }"
  >
    {{ product.isAvailable ? stockStatusTranslations[currentLocale].inStock : stockStatusTranslations[currentLocale].toOrder }}
  </span>
</template>

<style lang="scss" scoped>
.in-stock {
   font-weight: 600;
   color: var(--green-color);
}

.to-order {
   font-weight: 600;
   color: var( --danger-color);
}
</style>