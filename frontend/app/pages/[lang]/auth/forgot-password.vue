<script setup lang="ts">
import { authTranslations } from '~/locales/auth'

const { currentLocale } = useLocale()
const authStore = useAuthStore()

const t = computed(() => authTranslations[currentLocale.value])

const email = ref('')
const isSubmitting = ref(false)
const sent = ref(false)

const handleSubmit = async () => {
  if (!email.value) return
  isSubmitting.value = true
  try {
    await authStore.forgotPassword(email.value)
    sent.value = true
  } catch {
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-page__form-wrapper">
      <h1 class="auth-page__title">{{ t.forgotTitle }}</h1>

      <p v-if="sent" class="auth-page__success">{{ t.emailSent }}</p>

      <form v-else class="auth-page__form" @submit.prevent="handleSubmit">
        <UInput
          v-model="email"
          type="email"
          :label="t.emailLabel"
          placeholder="email@example.com"
          required
          autocomplete="email"
          class="auth-page__field"
        />

        <p v-if="authStore.error" class="auth-form__error">{{ authStore.error }}</p>

        <UButton
          type="submit"
          variant="primary"
          :is-disabled="isSubmitting || !email"
          class="auth-page__submit"
        >
          {{ isSubmitting ? '...' : t.forgotButton }}
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

  &__form {
    display: grid;
    gap: toRem(16);
  }

  &__success {
    text-align: center;
    color: var(--success-color);
    font-weight: 600;
    padding-block: toRem(20);
  }

  &__footer-text {
    margin-block-start: toRem(20);
    text-align: center;
  }

  &__link {
    color: var(--primary-color);
    text-decoration: underline;

    @include hover {
      color: var(--primary-hover);
    }
  }

  &__field {
    width: 100%;
  }

  &__submit {
    width: 100%;
  }
}

.auth-form__error {
  color: var(--danger-color);
  font-size: toRem(14);
  text-align: center;
}
</style>