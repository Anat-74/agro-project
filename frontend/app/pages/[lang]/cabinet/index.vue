<script setup lang="ts">
import { cabinetTranslations } from '~/locales/cabinet'

import OrderHistory from '~/components/auth/OrderHistory.vue'

definePageMeta({
  middleware: 'auth',
})

const { currentLocale } = useLocale()
const t = computed(() => cabinetTranslations[currentLocale.value])

const showToast = ref(false)
</script>

<template>
  <CabinetLayout>
    <AppNotification
      v-if="showToast"
      type="success"
      @close="showToast = false"
    >
      {{ t.loggedOut }}
    </AppNotification>

    <section class="cabinet-orders">
      <h2 class="cabinet-orders__title">{{ t.ordersTitle }}</h2>
      <OrderHistory />
    </section>
  </CabinetLayout>
</template>

<style lang="scss" scoped>
.cabinet-orders {
  &__title {
    @include adaptiveValue("font-size", 22, 18);
    font-weight: 600;
    margin-block-end: toRem(16);
  }
}
</style>
