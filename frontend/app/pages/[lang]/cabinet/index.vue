<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

import { cabinetTranslations } from '~/locales/cabinet'

const { currentLocale } = useLocale()
const t = computed(() => cabinetTranslations[currentLocale.value])
const authStore = useAuthStore()
const router = useRouter()
const { showNotification } = useNotification()

const showToast = ref(false)

import OrderHistory from '~/components/auth/OrderHistory.vue'

const handleLogout = async () => {
  authStore.logout()
  showToast.value = true
  await new Promise(r => setTimeout(r, 1500))
  router.push(`/${currentLocale.value}/auth/login`)
}
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
