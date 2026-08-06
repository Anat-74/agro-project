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
  (e: 'update:username' | 'update:email' | 'update:password', value: string): void
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

const passwordStrength = computed(() => {
  const p = props.password;
  if (!p) return 0;
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/d/.test(p)) score++;
  if (/[^a-zA-Z0-9]/.test(p)) score++;
  return score;
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
    <div v-if="props.password" class="auth-form__strength">
      <div class="auth-form__strength-bar">
        <div
          class="auth-form__strength-fill"
          :style="{ width: (passwordStrength / 5) * 100 + '%' }"
          :class="'auth-form__strength_' + ['none','weak','fair','good','strong','very'][passwordStrength]"
        />
      </div>
      <span class="auth-form__strength-label" :class="'auth-form__strength_' + ['none','weak','fair','good','strong','very'][passwordStrength]">
        {{ ['','Слабый','Средний','Хороший','Сильный','Очень сильный'][passwordStrength] }}
      </span>
    </div>

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

  &__strength {
    display: flex;
    align-items: center;
    gap: toRem(8);
  }

  &__strength-bar {
    height: toRem(4);
    border-radius: toRem(2);
    background: var(--border-color);
    flex: 1;
    overflow: hidden;
  }

  &__strength-fill {
    height: 100%;
    border-radius: toRem(2);
    transition: width 0.3s, background 0.3s;
  }

  &__strength_none { width: 0; background: transparent; }
  &__strength_weak { background: #e74c3c; }
  &__strength_fair { background: #e67e22; }
  &__strength_good { background: #f1c40f; }
  &__strength_strong { background: #2ecc71; }
  &__strength_very { background: #27ae60; }

  &__strength-label {
    font-size: toRem(11);
    white-space: nowrap;
    min-width: toRem(80);
    &.auth-form__strength_weak { color: #e74c3c; }
    &.auth-form__strength_fair { color: #e67e22; }
    &.auth-form__strength_good { color: #f1c40f; }
    &.auth-form__strength_strong { color: #2ecc71; }
    &.auth-form__strength_very { color: #27ae60; }
  }

  &__submit {
    width: 100%;
    margin-block-start: toRem(8);
  }
}
</style>
