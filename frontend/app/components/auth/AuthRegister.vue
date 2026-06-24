<script setup lang="ts">
interface Props {
  username: string
  email: string
  password: string
  error: string | null
  fieldErrors?: Record<string, string>
  isSubmitting: boolean
}

interface Emits {
  (e: 'update:username', value: string): void
  (e: 'update:email', value: string): void
  (e: 'update:password', value: string): void
  (e: 'submit'): void
}

const props = withDefaults(defineProps<Props>(), {
  fieldErrors: () => ({}),
})
const emit = defineEmits<Emits>()

/** Client-side валидация */
const usernameError = computed(() => {
  if (!props.username) return 'Обязательное поле'
  if (props.username.length < 2) return 'Минимум 2 символа'
  return ''
})

const emailError = computed(() => {
  if (!props.email) return 'Обязательное поле'
  if (!/^\S+@\S+\.\S+$/.test(props.email)) return 'Введите корректный email'
  return ''
})

const passwordError = computed(() => {
  if (!props.password) return 'Обязательное поле'
  if (props.password.length < 6) return 'Минимум 6 символов'
  return ''
})

const canSubmit = computed(() =>
  !usernameError.value && !emailError.value && !passwordError.value
)

const handleSubmit = () => {
  if (!canSubmit.value) return
  emit('submit')
}
</script>

<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <UInput
      type="text"
      :model-value="props.username"
      placeholder="Имя пользователя"
      label="Имя пользователя"
      required
      autocomplete="username"
      :error="fieldErrors['username'] || usernameError"
      class="auth-form__field"
      @update:model-value="emit('update:username', $event)"
    />

    <UInput
      type="email"
      :model-value="props.email"
      placeholder="Email"
      label="Email"
      required
      autocomplete="email"
      :error="fieldErrors['email'] || emailError"
      class="auth-form__field"
      @update:model-value="emit('update:email', $event)"
    />

    <UInput
      type="password"
      :model-value="props.password"
      placeholder="Пароль"
      label="Пароль"
      required
      autocomplete="new-password"
      :error="fieldErrors['password'] || passwordError"
      class="auth-form__field"
      @update:model-value="emit('update:password', $event)"
    />

    <p v-if="props.error && canSubmit" class="auth-form__error">
      {{ props.error }}
    </p>

    <UButton
      type="submit"
      variant="primary"
      :is-disabled="props.isSubmitting || !canSubmit"
      class="auth-form__submit"
    >
      {{ props.isSubmitting ? 'Регистрация...' : 'Зарегистрироваться' }}
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
