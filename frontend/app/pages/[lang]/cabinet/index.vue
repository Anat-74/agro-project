<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

import { cabinetTranslations } from '~/locales/cabinet'
import { authTranslations } from '~/locales/auth'

const { currentLocale } = useLocale()
const t = computed(() => cabinetTranslations[currentLocale.value])
const authT = computed(() => authTranslations[currentLocale.value])
const authStore = useAuthStore()
const router = useRouter()

const showToast = ref(false)

import OrderHistory from '~/components/OrderHistory.vue'
import ConfirmDeleteModal from '~/components/auth/ConfirmDeleteModal.vue'

const confirmModal = useTemplateRef<InstanceType<typeof ConfirmDeleteModal>>('confirm-modal')

const handleLogout = async () => {
  authStore.logout()
  showToast.value = true
  await new Promise(r => setTimeout(r, 1500))
  router.push(`/${currentLocale.value}/login`)
}

const confirmLogout = () => {
  confirmModal.value?.open?.()
}
</script>

<template>
  <div class="cabinet">
    <AppNotification
      v-if="showToast"
      type="success"
      @close="showToast = false"
    >
      {{ t.loggedOut }}
    </AppNotification>

    <div class="cabinet__header">
      <h1 class="cabinet__title">{{ t.title }}</h1>
      <UButton
        variant="secondary"
        :is-disabled="false"
        @click="confirmLogout"
      >
        {{ authT.logout }}
      </UButton>
    </div>

    <div class="cabinet__info" v-if="authStore.user">
      <div class="cabinet__avatar">
        {{ authStore.user.username?.charAt(0)?.toUpperCase() || '?' }}
      </div>
      <div class="cabinet__details">
        <p class="cabinet__name">{{ authStore.user.username }}</p>
        <p class="cabinet__email">{{ authStore.user.email }}</p>
        <NuxtLink :to="`/${currentLocale}/cabinet/edit`" class="cabinet__edit-link">{{ t.editProfile }}</NuxtLink>
      </div>
    </div>

    <section class="cabinet__orders">
      <h2 class="cabinet__section-title">{{ t.ordersTitle }}</h2>
      <OrderHistory />
    </section>

    <ConfirmDeleteModal
      ref="confirm-modal"
      title="Выход из аккаунта"
      message="Вы уверены, что хотите выйти? Для входа потребуется повторный ввод пароля."
      confirm-text="Выйти"
      cancel-text="Отмена"
      @confirm="handleLogout"
      @cancel="() => {}"
    />
  </div>
</template>

<style lang="scss" scoped>
.cabinet {
  max-width: toRem(960);
  margin-inline: auto;
  padding-block: toRem(40);
  padding-inline: toRem(16);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-block-end: toRem(32);
  }

  &__title {
    @include adaptiveValue("font-size", 28, 22);
    font-weight: 700;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: toRem(16);
    padding: toRem(20);
    background: var(--bg-secondary);
    border-radius: toRem(12);
    margin-block-end: toRem(32);
  }

  &__avatar {
    width: toRem(56);
    height: toRem(56);
    border-radius: 50%;
    background: var(--primary-color);
    color: #fff;
    display: grid;
    place-items: center;
    font-size: toRem(24);
    font-weight: 700;
    flex-shrink: 0;
  }

  &__name {
    font-weight: 600;
    @include adaptiveValue("font-size", 18, 16);
  }

  &__email {
    color: var(--text-muted);
    font-size: toRem(14);
  }

  &__edit-link {
    font-size: toRem(13);
    color: var(--primary-color);
    text-decoration: underline;
    justify-self: start;

    @include hover {
      color: var(--primary-hover);
    }
  }

  &__section-title {
    @include adaptiveValue("font-size", 22, 18);
    font-weight: 600;
    margin-block-end: toRem(16);
  }
}
</style>
