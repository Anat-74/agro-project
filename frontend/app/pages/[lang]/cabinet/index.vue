<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { currentLocale } = useLocale()
const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push(`/${currentLocale.value}/login`)
}
</script>

<template>
  <div class="cabinet">
    <div class="cabinet__header">
      <h1 class="cabinet__title">Личный кабинет</h1>
      <UButton
        variant="secondary"
        :is-disabled="false"
        @click="handleLogout"
      >
        Выйти
      </UButton>
    </div>

    <div class="cabinet__info" v-if="authStore.user">
      <div class="cabinet__avatar">
        {{ authStore.user.username?.charAt(0)?.toUpperCase() || '?' }}
      </div>
      <div class="cabinet__details">
        <p class="cabinet__name">{{ authStore.user.username }}</p>
        <p class="cabinet__email">{{ authStore.user.email }}</p>
      </div>
    </div>

    <section class="cabinet__orders">
      <h2 class="cabinet__section-title">История заказов</h2>
      <OrderHistory />
    </section>
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

  &__section-title {
    @include adaptiveValue("font-size", 22, 18);
    font-weight: 600;
    margin-block-end: toRem(16);
  }
}
</style>
