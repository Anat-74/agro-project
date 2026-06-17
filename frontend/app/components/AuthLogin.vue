<script setup lang="ts">
interface Props {
  identifier: string
  password: string
  error: string | null
  isSubmitting: boolean
}

interface Emits {
  (e: 'update:identifier', value: string): void
  (e: 'update:password', value: string): void
  (e: 'submit'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <form class="auth-form" @submit.prevent="emit('submit')">
    <UInput
      type="email"
      :model-value="props.identifier"
      placeholder="Email"
      label="Email"
      required
      autocomplete="email"
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
      class="auth-form__field"
      @update:model-value="emit('update:password', $event)"
    />

    <p v-if="props.error" class="auth-form__error">{{ props.error }}</p>

    <UButton
      type="submit"
      variant="primary"
      :is-disabled="props.isSubmitting"
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
