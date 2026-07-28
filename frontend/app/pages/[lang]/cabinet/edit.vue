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
    let avatarUrl = ''
    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('files', avatarFile.value)
      const uploadResponse = await strapiClient('/upload', { method: 'POST', body: formData }) as any[]
      avatarUrl = uploadResponse?.[0]?.url || ''
    }

    const userData: Record<string, any> = {
      username: username.value,
      email: email.value,
    }
    if (avatarUrl) userData.avatar = avatarUrl
    await strapiClient('/users/' + authStore.user?.id, { method: 'PUT', body: userData })

    if (newPassword.value && currentPassword.value) {
      const { changePassword } = useStrapiAuth()
      await changePassword({
        currentPassword: currentPassword.value,
        password: newPassword.value,
        passwordConfirmation: confirmPassword.value,
      })
    }

    await authStore.init()
    avatarFile.value = null
    success.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

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
</script>

<template>
  <CabinetLayout>
    <AppNotification
      v-if="success"
      type="success"
      @close="success = false"
    >
      {{ t.editSaved }}
    </AppNotification>

    <h1 class="edit-title">{{ t.editTitle }}</h1>

    <form class="edit-form" @submit.prevent="handleSave">
      <!-- Основное -->
      <section class="edit-card">
        <h2 class="edit-card__title">{{ t.editUsername }}</h2>

        <UInput
          v-model="username"
          type="text"
          :label="t.editUsername"
          :placeholder="t.editUsername"
          required
          autocomplete="username"
        />

        <UInput
          v-model="email"
          type="email"
          :label="t.editEmail"
          :placeholder="t.editEmail"
          required
          autocomplete="email"
        />

        <div class="edit-avatar">
          <p class="edit-avatar__label">{{ t.editAvatar }}</p>
          <div class="edit-avatar__preview">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              alt="Avatar"
              class="edit-avatar__img"
            />
            <span v-else class="edit-avatar__placeholder">
              {{ authStore.user?.username?.charAt(0)?.toUpperCase() || '?' }}
            </span>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="edit-avatar__input" @change="handleAvatarChange" />
          <UButton variant="secondary" :is-disabled="false" @click="fileInput?.click()">
            {{ t.editChoosePhoto }}
          </UButton>
        </div>
      </section>

      <!-- Безопасность -->
      <section class="edit-card">
        <h2 class="edit-card__title">{{ t.editPasswordSection }}</h2>

        <UInput
          v-model="currentPassword"
          type="password"
          :label="t.editCurrentPassword"
          :placeholder="t.editCurrentPassword"
          autocomplete="current-password"
        />

        <UInput
          v-model="newPassword"
          type="password"
          :label="t.editNewPassword"
          :placeholder="t.editNewPassword"
          autocomplete="new-password"
        />

        <UInput
          v-model="confirmPassword"
          type="password"
          :label="t.editConfirmPassword"
          :placeholder="t.editConfirmPassword"
          autocomplete="new-password"
        />
      </section>

      <p v-if="error" class="edit-form__error">{{ error }}</p>

      <div class="edit-form__actions">
        <UButton
          type="submit"
          variant="primary"
          :is-disabled="isSubmitting"
        >
          {{ isSubmitting ? t.editSaving : t.editSave }}
        </UButton>
      </div>
    </form>

    <!-- Опасная зона -->
    <section class="edit-card edit-card_danger">
      <h2 class="edit-card__title">{{ t.deleteButton }}</h2>
      <p class="edit-card__hint">{{ t.deleteConfirm }}</p>
      <UButton
        variant="secondary"
        :is-disabled="isDeleting"
        class="edit-delete-btn"
        @click="confirmDelete"
      >
        {{ t.deleteButton }}
      </UButton>
    </section>

    <ConfirmDeleteModal
      ref="delete-modal"
      :title="t.deleteTitle"
      :message="t.deleteConfirm"
      :confirm-text="t.deleteButton"
      :cancel-text="t.cancel"
      @confirm="deleteAccount"
      @cancel="() => {}"
    />
  </CabinetLayout>
</template>

<style lang="scss" scoped>
.edit-title {
  @include adaptiveValue("font-size", 26, 20);
  font-weight: 700;
  margin-block-end: toRem(24);
}

.edit-form {
  display: grid;
  gap: toRem(24);

  &__error {
    color: var(--danger-color);
    font-size: toRem(14);
    text-align: center;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
  }
}

.edit-card {
  display: grid;
  gap: toRem(16);
  padding: toRem(24);
  background: var(--bg-secondary);
  border-radius: toRem(12);

  &__title {
    font-weight: 600;
    @include adaptiveValue("font-size", 18, 16);
    margin: 0;
  }

  &__hint {
    font-size: toRem(13);
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }

  &_danger {
    border: 1px solid var(--danger-color);
  }
}

.edit-avatar {
  display: flex;
  align-items: center;
  gap: toRem(16);
  flex-wrap: wrap;

  &__label {
    font-size: toRem(14);
    font-weight: 600;
    margin: 0;
    min-width: toRem(80);
  }

  &__preview {
    width: toRem(64);
    height: toRem(64);
    border-radius: 50%;
    overflow: hidden;
    background: var(--bg);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    font-weight: 700;
    font-size: toRem(20);
    color: var(--text-muted);
  }

  &__input {
    display: none;
  }
}

.edit-delete-btn {
  color: var(--danger-color);
  border-color: var(--danger-color);
  justify-self: start;
  font-size: toRem(13);
}
</style>
