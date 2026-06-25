<script setup lang="ts">
import { authTranslations } from '~/locales/auth'

const { currentLocale } = useLocale()
const t = computed(() => authTranslations[currentLocale.value])
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { showNotification } = useNotification()

const identifier = ref('')
const password = ref('')
const isSubmitting = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

const handleLogin = async () => {
  if (!identifier.value || !password.value) return
  isSubmitting.value = true
  try {
    await authStore.login(identifier.value, password.value)
    toastMessage.value = `Вы вошли как ${identifier.value}`
    showToast.value = true
    await new Promise(r => setTimeout(r, 1200))
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
    <AppNotification
      v-if="showToast"
      type="success"
      @close="showToast = false"
    >
      {{ toastMessage }}
    </AppNotification>

    <section class="auth-page__form-wrapper">
      <h1 class="auth-page__title">{{ t.loginTitle }}</h1>
      <AuthLogin
        :identifier="identifier"
        :password="password"
        :error="authStore.error"
        :field-errors="authStore.fieldErrors"
        :is-submitting="isSubmitting"
        @update:identifier="identifier = $event"
        @update:password="password = $event"
        @submit="handleLogin"
      />
      <p class="auth-page__footer-text">
        {{ t.noAccount }}
        <NuxtLink :to="`/${currentLocale}/register`" class="auth-page__link">
          {{ t.registerButton }}
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
