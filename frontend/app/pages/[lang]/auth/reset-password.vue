<script setup lang="ts">
import { authTranslations } from '~/locales/auth'

definePageMeta({
  viewTransition: {
    enabled: true,
    toTypes: ['slide-forward'],
    fromTypes: ['slide-back'],
  },
})

const { currentLocale } = useLocale()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const t = computed(() => authTranslations[currentLocale.value])

const code = ref((route.query.code as string) || '')
const password = ref('')
const passwordConfirmation = ref('')
const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (!code.value || !password.value || !passwordConfirmation.value) return
  if (password.value !== passwordConfirmation.value) {
    authStore.error = t.value.errors.passwordsDontMatch
    return
  }
  isSubmitting.value = true
  try {
    await authStore.resetPassword(code.value, password.value, passwordConfirmation.value)
    const redirect = `/${currentLocale.value}/cabinet`
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
      <h1 class="auth-page__title">{{ t.resetTitle }}</h1>

      <form class="auth-page__form" @submit.prevent="handleSubmit">
        <UInput
          v-model="code"
          type="text"
          :label="t.codeLabel"
          placeholder="..."
          required
          class="auth-page__field"
        />

        <UInput
          v-model="password"
          type="password"
          :label="t.newPasswordLabel"
          placeholder="******"
          required
          autocomplete="new-password"
          class="auth-page__field"
        />

        <UInput
          v-model="passwordConfirmation"
          type="password"
          :label="t.confirmPasswordLabel"
          placeholder="******"
          required
          autocomplete="new-password"
          class="auth-page__field"
        />

        <p v-if="authStore.error" class="auth-form__error">{{ authStore.error }}</p>

        <UButton
          type="submit"
          variant="primary"
          :is-disabled="isSubmitting || !code || !password || !passwordConfirmation"
          class="auth-page__submit"
        >
          {{ isSubmitting ? '...' : t.resetButton }}
        </UButton>
      </form>

      <p class="auth-page__footer-text">
        <NuxtLink :to="`/${currentLocale}/auth/login`" class="auth-page__link">
          {{ t.backToLogin }}
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

  &__form-wrapper { width: 100%; max-width: toRem(420); }
  &__title { @include adaptiveValue("font-size", 28, 22); font-weight: 700; margin-block-end: toRem(24); text-align: center; }
  &__form { display: grid; gap: toRem(16); }
  &__field { width: 100%; }
  &__submit { width: 100%; }
  &__footer-text { margin-block-start: toRem(20); text-align: center; }
  &__link { color: var(--primary-color); text-decoration: underline; @include hover { color: var(--primary-hover); } }
}
.auth-form__error { color: var(--danger-color); font-size: toRem(14); text-align: center; }
</style>