<script setup lang="ts">
const { currentLocale } = useLocale()
const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const showToast = ref(false)

const handleRegister = async () => {
  if (!username.value || !email.value || !password.value) return
  isSubmitting.value = true
  try {
    await authStore.register(username.value, email.value, password.value)
    showToast.value = true
    await new Promise(r => setTimeout(r, 1200))
    await router.push(`/${currentLocale.value}/cabinet`)
  } catch {
    // ошибка уже в authStore.error
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <AppNotification
      v-if="showToast"
      type="success"
      @close="showToast = false"
    >
      Аккаунт создан! Добро пожаловать, {{ username }}
    </AppNotification>

    <section class="auth-page__form-wrapper">
      <h1 class="auth-page__title">Регистрация</h1>
      <AuthRegister
        :username="username"
        :email="email"
        :password="password"
        :error="authStore.error"
        :field-errors="authStore.fieldErrors"
        :is-submitting="isSubmitting"
        @update:username="username = $event"
        @update:email="email = $event"
        @update:password="password = $event"
        @submit="handleRegister"
      />
      <p class="auth-page__footer-text">
        Уже есть аккаунт?
        <NuxtLink :to="`/${currentLocale}/login`" class="auth-page__link">
          Войти
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
