<script setup lang="ts">
import { cabinetTranslations } from '~/locales/cabinet'
import { authTranslations } from '~/locales/auth'

const { currentLocale } = useLocale()
const t = computed(() => cabinetTranslations[currentLocale.value])
const authT = computed(() => authTranslations[currentLocale.value])
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const handleLogout = async () => {
  authStore.logout()
  await router.push(`/${currentLocale.value}/auth/login`)
}

const navItems = computed(() => [
  {
    label: t.value.title,
    icon: 'cil:user',
    to: `/${currentLocale.value}/cabinet`,
  },
  {
    label: t.value.editProfile,
    icon: 'cil:pencil',
    to: `/${currentLocale.value}/cabinet/edit`,
  },
  {
    label: authT.value.logout,
    icon: 'cil:exit',
    to: null,
    action: handleLogout,
  },
])

function isActive(item: { to?: string | null }): boolean {
  return !!item.to && route.path === item.to
}
</script>

<template>
  <div class="cabinet-layout">
    <aside class="cabinet-layout__sidebar">
      <div class="cabinet-layout__user">
        <div class="cabinet-layout__avatar">
          <UImage
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            :alt="authStore.user.username"
            type="avatar"
          />
          <span v-else class="cabinet-layout__initials">
            {{ authStore.user?.username?.charAt(0)?.toUpperCase() || '?' }}
          </span>
        </div>
        <p class="cabinet-layout__name">{{ authStore.user?.username }}</p>
        <p class="cabinet-layout__email">{{ authStore.user?.email }}</p>
      </div>

      <nav class="cabinet-layout__nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || ''"
          :class="['cabinet-layout__link', { 'cabinet-layout__link_active': isActive(item) }]"
          @click.prevent="item.action ? item.action() : undefined"
        >
          <Icon :name="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </aside>

    <div class="cabinet-layout__content">
      <!-- Mobile tabs -->
      <nav class="cabinet-layout__tabs">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || ''"
          :class="['cabinet-layout__tab', { 'cabinet-layout__tab_active': isActive(item) }]"
          @click.prevent="item.action ? item.action() : undefined"
        >
          <Icon :name="item.icon" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cabinet-layout {
  display: grid;
  max-width: toRem(1200);
  margin-inline: auto;
  padding-block: toRem(40);
  padding-inline: toRem(16);
  gap: toRem(32);

  @media (min-width: $tablet) {
    grid-template-columns: toRem(260) 1fr;
  }

  &__sidebar {
    display: none;

    @media (min-width: $tablet) {
      display: grid;
      align-content: start;
      gap: toRem(24);
      padding: toRem(24);
      background: var(--bg-secondary);
      border-radius: toRem(12);
      position: sticky;
      top: calc(100px);
    }
  }

  &__user {
    text-align: center;
    display: grid;
    justify-items: center;
    gap: toRem(8);
  }

  &__avatar {
    width: toRem(72);
    height: toRem(72);
    border-radius: 50%;
    overflow: hidden;
    background: var(--primary-color);
    display: grid;
    place-items: center;
  }

  &__initials {
    font-size: toRem(28);
    font-weight: 700;
    color: #fff;
  }

  &__name {
    font-weight: 600;
    @include adaptiveValue("font-size", 18, 16);
    margin: 0;
  }

  &__email {
    font-size: toRem(13);
    color: var(--text-muted);
    margin: 0;
  }

  &__nav {
    display: grid;
    gap: toRem(4);
  }

  &__link {
    display: flex;
    align-items: center;
    gap: toRem(10);
    padding: toRem(10) toRem(14);
    border-radius: toRem(8);
    color: var(--color);
    text-decoration: none;
    font-weight: 500;
    font-size: toRem(14);
    transition: background var(--transition-duration), color var(--transition-duration);

    @include hover {
      background: var(--whitesmoke-color);
    }

    &_active {
      background: var(--primary-color);
      color: #fff;

      @include hover {
        background: var(--primary-hover);
      }
    }

    svg {
      font-size: toRem(20);
      flex-shrink: 0;
    }
  }

  &__tabs {
    display: flex;
    gap: toRem(8);
    margin-block-end: toRem(24);
    overflow-x: auto;
    scrollbar-width: none;

    @media (min-width: $tablet) {
      display: none;
    }
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: toRem(6);
    padding: toRem(8) toRem(14);
    border-radius: toRem(20);
    font-size: toRem(13);
    font-weight: 500;
    white-space: nowrap;
    text-decoration: none;
    color: var(--color);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    transition: all var(--transition-duration);

    &_active {
      background: var(--primary-color);
      color: #fff;
      border-color: var(--primary-color);
    }

    svg {
      font-size: toRem(16);
      flex-shrink: 0;
    }
  }

  &__content {
    min-width: 0;
  }
}
</style>
