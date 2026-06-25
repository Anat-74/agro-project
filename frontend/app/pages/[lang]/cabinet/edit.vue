<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

import { cabinetTranslations } from '~/locales/cabinet'
import ConfirmDeleteModal from '~/components/auth/ConfirmDeleteModal.vue'

const { currentLocale } = useLocale()
const authStore = useAuthStore()
const router = useRouter()
const strapiClient = useStrapiClient()
const { logout: strapiLogout } = useStrapiAuth()
const t = computed(() => cabinetTranslations[currentLocale.value])

const username = ref(authStore.user?.username || '')
const email = ref(authStore.user?.email || '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref(authStore.user?.avatar || '')
const fileInput = ref<HTMLInputElement | null>(null)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const handleAvatarChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    avatarFile.value = input.files[0]
    const reader = new FileReader()
    reader.onload = (ev) => { avatarPreview.value = ev.target?.result as string }
    reader.readAsDataURL(input.files[0])
  }
}

const handleSave = async () => {
  error.value = null
  success.value = false

  // Client-side validation
  if (!username.value) { error.value = t.value.editErrorRequired; return }
  if (!email.value || !/^\S+@\S+\.\S+$/.test(email.value)) {
    error.value = t.value.editErrorEmail
    return
  }
  if (newPassword.value && newPassword.value.length < 6) {
    error.value = t.value.editErrorPasswordLength
    return
  }
  if (newPassword.value && newPassword.value !== confirmPassword.value) {
    error.value = t.value.editErrorPasswordMatch
    return
  }

  isSubmitting.value = true
  try {
    // Загрузка аватара
    let avatarUrl = ''
    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('files', avatarFile.value)
      const uploadResponse = await strapiClient('/upload', { method: 'POST', body: formData }) as any[]
      avatarUrl = uploadResponse?.[0]?.url || ''
    }

    // Обновление профиля
    const userData: Record<string, any> = {
      username: username.value,
      email: email.value,
    }
    if (avatarUrl) userData.avatar = avatarUrl
    await strapiClient('/users/' + authStore.user?.id, { method: 'PUT', body: userData })

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
    avatarFile.value = null
    success.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    // Скрыть уведомление через 3 секунды
    setTimeout(() => { success.value = false }, 3000)
  } catch (e: any) {
    const raw = e?.error?.message || e?.message || t.value.error
    console.error('Profile save error:', e)
    error.value = raw
  } finally {
    isSubmitting.value = false
  }
}

const deleteModal = useTemplateRef<InstanceType<typeof ConfirmDeleteModal>>('delete-modal')
const isDeleting = ref(false)

const confirmDelete = () => {
  deleteModal.value?.open?.()
}

const deleteAccount = async () => {
  isDeleting.value = true
  try {
    // Удалить все заказы пользователя
    if (authStore.user?.email) {
      const orders = await strapiClient('/orders?filters[email][$eq]=' + encodeURIComponent(authStore.user.email), { method: 'GET' }) as any
      const items = orders?.data || []
      for (const order of items) {
        const id = order.documentId || order.id
        if (id) {
          await strapiClient('/orders/' + id, { method: 'DELETE' }).catch(() => {})
        }
      }
    }

    await strapiClient('/users/' + authStore.user?.id, { method: 'DELETE' })
    strapiLogout()
    authStore.user = null
    authStore.token = null
    authStore.error = null
    router.push('/' + currentLocale.value)
  } catch (e: any) {
    error.value = e?.error?.message || e?.message || 'Ошибка удаления'
  } finally {
    isDeleting.value = false
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
      {{ t.editBack }}
    </UButton>

    <h1 class="profile-edit__title">{{ t.editTitle }}</h1>

    <AppNotification
      v-if="success"
      type="success"
      @close="success = false"
    >
      {{ t.editSaved }}
    </AppNotification>

    <form class="profile-edit__form" @submit.prevent="handleSave">
      <UInput
        v-model="username"
        type="text"
        :label="t.editUsername"
        :placeholder="t.editUsername"
        required
        autocomplete="username"
        class="profile-edit__field"
      />

      <UInput
        v-model="email"
        type="email"
        :label="t.editEmail"
        :placeholder="t.editEmail"
        required
        autocomplete="email"
        class="profile-edit__field"
      />

      <div class="profile-edit__avatar-section">
        <p class="profile-edit__avatar-label">{{ t.editAvatar }}</p>
        <div class="profile-edit__avatar-preview">
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            alt="Avatar"
            class="profile-edit__avatar-img"
          />
          <span v-else class="profile-edit__avatar-placeholder">
            {{ authStore.user?.username?.charAt(0)?.toUpperCase() || '?' }}
          </span>
        </div>
        <div class="profile-edit__avatar-upload">
          <input ref="fileInput" type="file" accept="image/*" @change="handleAvatarChange" />
          <UButton variant="secondary" :is-disabled="false" @click="fileInput?.click()">{{ t.editChoosePhoto }}</UButton>
        </div>
      </div>

      <hr class="profile-edit__divider">

      <p class="profile-edit__section-hint">{{ t.editPasswordSection }}</p>

      <UInput
        v-model="currentPassword"
        type="password"
        :label="t.editCurrentPassword"
        :placeholder="t.editCurrentPassword"
        autocomplete="current-password"
        class="profile-edit__field"
      />

      <UInput
        v-model="newPassword"
        type="password"
        :label="t.editNewPassword"
        :placeholder="t.editNewPassword"
        autocomplete="new-password"
        class="profile-edit__field"
      />

      <UInput
        v-model="confirmPassword"
        type="password"
        :label="t.editConfirmPassword"
        :placeholder="t.editConfirmPassword"
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
          {{ isSubmitting ? t.editSaving : t.editSave }}
        </UButton>
      </div>
    </form>

    <hr class="profile-edit__divider">

    <div class="profile-edit__delete-section">
      <UButton
        variant="secondary"
        :is-disabled="isDeleting"
        class="profile-edit__delete-btn"
        @click="confirmDelete"
      >
        {{ t.deleteButton }}
      </UButton>
    </div>

    <ConfirmDeleteModal
      ref="delete-modal"
      :title="t.deleteTitle"
      :message="t.deleteConfirm"
      :confirm-text="t.deleteButton"
      :cancel-text="t.cancel"
      @confirm="deleteAccount"
      @cancel="() => {}"
    />
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

  &__avatar-section {
    display: flex;
    align-items: center;
    gap: toRem(16);
    flex-wrap: wrap;
  }

  &__avatar-label {
    font-size: toRem(14);
    font-weight: 600;
    margin: 0;
    min-width: toRem(80);
  }

  &__avatar-preview {
    width: toRem(64);
    height: toRem(64);
    border-radius: 50%;
    overflow: hidden;
    background: var(--bg-secondary);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__avatar-placeholder {
    font-weight: 700;
    font-size: toRem(20);
    color: var(--text-muted);
  }

  &__avatar-upload {
    input[type="file"] {
      display: none;
    }
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

  &__delete-section {
    display: flex;
    justify-content: center;
    margin-block-start: toRem(16);
  }

  &__delete-btn {
    color: var(--danger-color);
    border-color: var(--danger-color);
    font-size: toRem(13);
  }
}
</style>
