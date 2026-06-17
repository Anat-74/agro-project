<script setup lang="ts">
const { currentLocale } = useLocale()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const identifier = ref('')
const password = ref('')
const isSubmitting = ref(false)

const handleLogin = async () => {
  if (!identifier.value || !password.value) return
  isSubmitting.value = true
  try {
    await authStore.login(identifier.value, password.value)
    const redirect = (route.query.redirect as string) || `/${currentLocale.value}/cabinet`
    await router.push(redirect)
  } catch {
    // ошибка уже в authStore.error
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-page__form-wrapper">
      <h1 class="auth-page__title">Вход</h1>
      <AuthLogin
        :identifier="identifier"
        :password="password"
        :error="authStore.error"
        :is-submitting="isSubmitting"
        @update:identifier="identifier = $event"
        @update:password="password = $event"
        @submit="handleLogin"
      />
      <p class="auth-page__footer-text">
        Нет аккаунта?
        <NuxtLink :to="`/${currentLocale}/register`" class="auth-page__link">
          Зарегистрироваться
        </NuxtLink>
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: 60vh;
  display: grid;
  place-items: center;
  padding-block: toRem(60);
  padding-inline: toRem(16);

  &__form-wrapper {
    width: 100%;
    max-width: toRem(420);
  }

  &__title {
    @include adaptiveValue("font-size", 28, 22);
    font-weight: 700;
    margin-block-end: toRem(24);
    text-align: center;
  }

  &__footer-text {
    margin-block-start: toRem(20);
    text-align: center;
    color: var(--text-muted);
  }

  &__link {
    color: var(--primary-color);
    text-decoration: underline;

    @include hover {
      color: var(--primary-hover);
    }
  }
}
</style>
