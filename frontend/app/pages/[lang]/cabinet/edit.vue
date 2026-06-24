<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { currentLocale } = useLocale()
const authStore = useAuthStore()
const router = useRouter()
const { update } = useStrapi()

const username = ref(authStore.user?.username || '')
const email = ref(authStore.user?.email || '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const handleSave = async () => {
  error.value = null
  success.value = false

  // Client-side validation
  if (!username.value) { error.value = 'Имя обязательно'; return }
  if (!email.value || !/^\S+@\S+\.\S+$/.test(email.value)) {
    error.value = 'Введите корректный email'
    return
  }
  if (newPassword.value && newPassword.value.length < 6) {
    error.value = 'Новый пароль: минимум 6 символов'
    return
  }
  if (newPassword.value && newPassword.value !== confirmPassword.value) {
    error.value = 'Новый пароль и подтверждение не совпадают'
    return
  }

  isSubmitting.value = true
  try {
    // Обновление профиля
    await update('users/me', {
      username: username.value,
      email: email.value,
    })

    // Смена пароля, если указан
    if (newPassword.value && currentPassword.value) {
      const { changePassword } = useStrapiAuth()
      await changePassword({
        currentPassword: currentPassword.value,
        password: newPassword.value,
        passwordConfirmation: confirmPassword.value,
      })
    }

    // Обновить локального пользователя
    await authStore.init()
    success.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    // Скрыть уведомление через 3 секунды
    setTimeout(() => { success.value = false }, 3000)
  } catch (e: any) {
    const raw = e?.response?.data?.error?.message || e?.message || 'Ошибка сохранения'
    error.value = raw
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push(`/${currentLocale.value}/cabinet`)
}
</script>

<template>
  <div class="profile-edit">
    <UButton
      variant="secondary"
      :is-disabled="false"
      class="profile-edit__back"
      @click="goBack"
    >
      ← Назад
    </UButton>

    <h1 class="profile-edit__title">Редактирование профиля</h1>

    <AppNotification
      v-if="success"
      type="success"
      @close="success = false"
    >
      Профиль сохранён
    </AppNotification>

    <form class="profile-edit__form" @submit.prevent="handleSave">
      <UInput
        v-model="username"
        type="text"
        label="Имя пользователя"
        placeholder="Имя"
        required
        autocomplete="username"
        class="profile-edit__field"
      />

      <UInput
        v-model="email"
        type="email"
        label="Email"
        placeholder="Email"
        required
        autocomplete="email"
        class="profile-edit__field"
      />

      <hr class="profile-edit__divider">

      <p class="profile-edit__section-hint">Заполните только если хотите сменить пароль</p>

      <UInput
        v-model="currentPassword"
        type="password"
        label="Текущий пароль"
        placeholder="Текущий пароль"
        autocomplete="current-password"
        class="profile-edit__field"
      />

      <UInput
        v-model="newPassword"
        type="password"
        label="Новый пароль"
        placeholder="Новый пароль (мин. 6 символов)"
        autocomplete="new-password"
        class="profile-edit__field"
      />

      <UInput
        v-model="confirmPassword"
        type="password"
        label="Подтвердите новый пароль"
        placeholder="Повторите новый пароль"
        autocomplete="new-password"
        class="profile-edit__field"
      />

      <p v-if="error" class="profile-edit__error">{{ error }}</p>

      <div class="profile-edit__actions">
        <UButton
          type="submit"
          variant="primary"
          :is-disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Сохранение...' : 'Сохранить' }}
        </UButton>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.profile-edit {
  max-width: toRem(520);
  margin-inline: auto;
  padding-block: toRem(40);
  padding-inline: toRem(16);

  &__back {
    margin-block-end: toRem(24);
  }

  &__title {
    @include adaptiveValue("font-size", 26, 20);
    font-weight: 700;
    margin-block-end: toRem(24);
  }

  &__form {
    display: grid;
    gap: toRem(16);
  }

  &__field {
    width: 100%;
  }

  &__divider {
    border: none;
    border-block-start: 1px solid var(--border-color);
    margin-block: toRem(8);
  }

  &__section-hint {
    font-size: toRem(13);
    color: var(--text-muted);
    margin: 0;
  }

  &__error {
    color: var(--danger-color);
    font-size: toRem(14);
    text-align: center;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-block-start: toRem(8);
  }
}
</style>
