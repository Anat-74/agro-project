<script setup lang="ts">
interface Props {
  identifier: string
  password: string
  error: string | null
  fieldErrors?: Record<string, string>
  isSubmitting: boolean
}

interface Emits {
  (e: 'update:identifier', value: string): void
  (e: 'update:password', value: string): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  fieldErrors: () => ({}),
})
const emit = defineEmits<Emits>()

/** Client-side валидация */
const identifierError = computed(() => {
  if (!props.identifier) return 'Обязательное поле'
  if (!/^\S+@\S+\.\S+$/.test(props.identifier)) return 'Введите корректный email'
  return ''
})

const passwordError = computed(() => {
  if (!props.password) return 'Обязательное поле'
  return ''
})

const canSubmit = computed(() => !identifierError.value && !passwordError.value)

const handleSubmit = () => {
  if (!canSubmit.value) return
  emit('submit')
}
</script>

<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <UInput
      type="email"
      :model-value="props.identifier"
      placeholder="Email"
      label="Email"
      required
      autocomplete="email"
      :error="fieldErrors['identifier'] || fieldErrors['email'] || identifierError"
      class="auth-form__field"
      @update:model-value="emit('update:identifier', $event)"
    />

    <UInput
      type="password"
      :model-value="props.password"
      placeholder="Пароль"
      label="Пароль"
      required
      autocomplete="current-password"
      :error="fieldErrors['password'] || passwordError"
      class="auth-form__field"
      @update:model-value="emit('update:password', $event)"
    />

    <p v-if="props.error && !identifierError && !passwordError" class="auth-form__error">
      {{ props.error }}
    </p>

    <UButton
      type="submit"
      variant="primary"
      :is-disabled="props.isSubmitting || !canSubmit"
      class="auth-form__submit"
    >
      {{ props.isSubmitting ? 'Вход...' : 'Войти' }}
    </UButton>
  </form>
</template>

<style lang="scss" scoped>
.auth-form {
  display: grid;
  gap: toRem(16);

  &__error {
    color: var(--danger-color);
    font-size: toRem(14);
    text-align: center;
  }

  &__submit {
    width: 100%;
    margin-block-start: toRem(8);
  }
}
</style>
