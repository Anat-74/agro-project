<script setup lang="ts">
import { cabinetTranslations } from '~/locales/cabinet'
import { authTranslations } from '~/locales/auth'

const { isAuthenticated, user } = useAuth()
const { currentLocale } = useLocale()

const cabinetT = computed(() => cabinetTranslations[currentLocale.value])
const authT = computed(() => authTranslations[currentLocale.value])
</script>

<template>
  <ClientOnly>
    <NuxtLink
      :to="isAuthenticated ? `/${currentLocale}/cabinet` : `/${currentLocale}/auth/login`"
      class="profile-link"
      :aria-label="isAuthenticated ? cabinetT.title : authT.loginButton"
    >
      <UImage v-if="isAuthenticated && user?.avatar" :src="user.avatar" :alt="user.username" type="avatar" class="profile-link__avatar" />
      <span v-else-if="isAuthenticated && user?.username" class="profile-link__initials">{{ user.username.charAt(0).toUpperCase() }}</span>
      <Icon v-else name="cil:user" width="28" height="28" />
    </NuxtLink>
    <!-- Заглушка резервирует место при SSR (сам NuxtLink внутри ClientOnly не рендерится на сервере) —
         без неё колонка 0px и ряд сдвигается после гидратации -->
    <template #fallback>
      <span class="profile-link__placeholder" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.profile-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: toRem(32);   // держит колонку после гидратации (контент 28 или 32px)
  transition: opacity var(--transition-duration);
  translate: 0 toRem(3);

  svg {
    color: var(--primary-color);
    transition: transform var(--transition-duration);
  }

  @include hover {
    svg {
      transform: scale(1.15);
    }
  }

  @media (max-width: $mobile) {
    justify-self: end;
  }

  &__avatar {
    width: toRem(32);
    height: toRem(32);

    :deep(.app-image__img) {
      width: toRem(32);
      height: toRem(32);
      object-fit: cover;
      border-radius: 50%;
    }
  }

  &__initials {
    width: toRem(32);
    height: toRem(32);
    border-radius: 50%;
    background: var(--primary-color);
    color: var(--light-color);
    display: grid;
    place-items: center;
    font-weight: 700;
    @include adaptiveValue("font-size", 15, 13);
    transition: transform var(--transition-duration);
  }

  &__placeholder {
    width: toRem(32);
    height: toRem(32);
  }
}
</style>
