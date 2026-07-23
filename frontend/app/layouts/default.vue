<script setup lang="ts">
import ShowHamburger from '~/components/show-modal/ShowHamburger.vue'
import { cabinetTranslations } from '~/locales/cabinet'
import { authTranslations } from '~/locales/auth'
import { baseNavigationTranslations } from '~/locales/baseNavigation'

const { find } = useStrapi();
const { isAuthenticated, user } = useAuth();
const { currentLocale } = useLocale();
console.debug("auth state:", isAuthenticated.value);

const cabinetT = computed(() => cabinetTranslations[currentLocale.value])
const authT = computed(() => authTranslations[currentLocale.value])
const navT = computed(() => baseNavigationTranslations[currentLocale.value])

const isNavHidden = ref(false)
const lastScrollY = ref(0)

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

function onScroll() {
  const currentY = window.scrollY
  const delta = currentY - lastScrollY.value

  if (delta > 5 && currentY > 80) {
    isNavHidden.value = true
  } else if (delta < -5) {
    isNavHidden.value = false
  }

  lastScrollY.value = currentY
}

const {
  data: global,
  error,
  refresh,
} = useAsyncData(`global-${currentLocale.value}`, async () => {
  const response = await find("global", {
    filters: { locale: { $eq: currentLocale.value } } as any,
  });

  if (!response.data) {
    throw createError({ statusCode: 404, message: "Global not found" });
  }

  return response.data as unknown as GlobalData;
});

watch(currentLocale, () => {
  refresh();
});

console.debug("global data:", global.value);
</script>

<template>
  <header class="header">
    <BannerLayouts />
    <div class="header__container-top">
      <Logo
        v-if="global"
        class="header__logo"
        :global="global"
        width="48"
        height="48"
      />
      <ProductFilter class="header__search" />
      <ChatAssistant />
      <Basket class="header__cart" />
      <ClientOnly>
        <NuxtLink
          :to="isAuthenticated ? `/${currentLocale}/cabinet` : `/${currentLocale}/auth/login`"
          class="header__profile"
          :aria-label="isAuthenticated ? cabinetT.title : authT.loginButton"
        >
          <UImage v-if="isAuthenticated && user?.avatar" :src="user.avatar" :alt="user.username" type="avatar" class="header__avatar" />
          <span v-else-if="isAuthenticated && user?.username" class="header__initials">{{ user.username.charAt(0).toUpperCase() }}</span>
          <Icon v-else name="cil:user" width="28" height="28" />
        </NuxtLink>
      </ClientOnly>
    </div>
    <div class="header__bottom" :class="{ 'header__bottom_hidden': isNavHidden }">
      <div class="header__container-bottom">
        <UAnimatedText variant="wave" />
        <details class="header__more">
          <summary class="header__more-summary">{{ navT.more }} ▾</summary>
          <ul class="header__more-list">
            <li v-for="item in global?.header?.navigation || []" :key="item.id" class="header__more-item">
              <NuxtLink :to="`/${currentLocale}${item.url}`" class="header__more-link">
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </details>
        <NuxtLink
          :to="`/${currentLocale}/blog`"
          class="header__blog-link"
        >Блог</NuxtLink>
        <ShowHamburger
          v-if="global"
          :phones="global.phones"
          :footer="global.footer"
          :socials="global.socials"
          :global="global"
        />
      </div>
    </div>
  </header>

  <div class="page-body">
    <SearchOverlay />
    <UBackground
      v-if="global?.background?.enableBackground"
      :background-options="global.background.options"
      variant="clean"
      size-mode="cover"
    />

    <main>
      <slot />
    </main>

    <Footer
      class="footer"
      v-if="global"
      :phones="global.phones"
      :email="global.email"
      :footer="global.footer"
      :legal="global.legal"
      :socials="global.socials"
      :global="global"
    />

    <span v-if="error"> Error: {{ error.message }} </span>
  </div>
</template>

<style lang="scss" scoped>
.header {
  position: relative;
  z-index: 3;
  padding-block-end: toRem(22);

  &__container-top {
    position: sticky;
    top: 0;
    z-index: 2;
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    align-items: center;
    column-gap: toRem(16);
    padding-block: toEm(16);
    background-color: var(--bg);
    @include adaptiveValue("height", 65, 55);

    @media (max-width: $mobile) {
      grid-template-columns: auto 1fr auto auto auto;
      column-gap: toRem(8);
    }
  }

  &__logo {
    justify-self: start;
  }

  &__search {
    justify-self: end;
    width: toRem(140);

    @media (max-width: $mobile) {
      width: toRem(120);
    }
  }

  .chat-assistant {
    display: contents;
  }

  &__cart {
    translate: 0 toRem(3);
  }

  &__profile {
    display: flex;
    align-items: center;
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
    color: #fff;
    display: grid;
    place-items: center;
    font-weight: 700;
    @include adaptiveValue("font-size", 15, 13);
    transition: transform var(--transition-duration);
  }

  &__profile_auth {
    text-decoration: none;

    @include hover {
      .header__initials {
        transform: scale(1.15);
      }
    }
  }

  &__bottom {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--bg-navigation);
    transition: transform 0.3s ease;

    &_hidden {
      transform: translateY(-100%);
    }
  }

  &__container-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: toRem(12);
    @include adaptiveValue("height", 64, 44);

    @media (max-width: $mobile) {
      padding-block: toRem(6);
    }
  }

  &__more {
    position: relative;

    &-summary {
      cursor: pointer;
      list-style: none;
      padding: toRem(4) toRem(8);
      font-weight: 500;
      color: var(--primary-color);
    }

    &-list {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 10;
      background: var(--secondary-color);
      border: toRem(1) solid var(--border-color);
      border-radius: toRem(4);
      padding: toRem(4);
      display: flex;
      flex-direction: column;
      gap: toRem(2);
      white-space: nowrap;
      box-shadow: 0 toRem(4) toRem(12) rgba(0,0,0,0.1);
    }

    &-item {
      list-style: none;
    }

    &-link {
      display: block;
      padding: toRem(6) toRem(12);
      color: var(--color);
      text-decoration: none;
      border-radius: toRem(4);

      @include hover {
        background: var(--bg);
      }
    }
  }

  &__blog-link {
    font-weight: 600;
    color: var(--danger-color);
    text-decoration: none;
    white-space: nowrap;

    @include hover {
      text-decoration: underline;
    }
  }

  &__navigation {
    justify-self: end;
  }
}

.page-body {
  position: relative;
  z-index: 0;
  min-height: 100dvh;
}
</style>
