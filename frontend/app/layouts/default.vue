<script setup lang="ts">
import { cabinetTranslations } from '~/locales/cabinet'
import { authTranslations } from '~/locales/auth'
import ShowHamburger from '~/components/show-modal/ShowHamburger.vue'

const { find } = useStrapi();
const searchStore = useSearchStore();
const { isAuthenticated, user } = useAuth();
const cabinetT = computed(() => cabinetTranslations[currentLocale.value])
const authT = computed(() => authTranslations[currentLocale.value])
const { products, totalPages, currentPage } = storeToRefs(searchStore);
const { currentLocale } = useLocale();
console.debug("auth state:", isAuthenticated.value);

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
}, { server: false });

watch(currentLocale, () => {
  refresh();
});

console.debug("global data:", global.value);
</script>

<template>
  <header class="header">
    <BannerLayouts class="header__banner" />
    <div class="header__container-top">
      <Logo
        v-if="global"
        class="header__logo hidden-mobile"
        :global="global"
        width="48"
        height="48"
      />
      <AnimateTitle class="hidden-mobile" />
      <ProductFilter class="header__search" />
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
    <div class="header__bottom">
      <div class="header__container-bottom">
        <Logo
          v-if="global"
          class="header__logo visible-mobile"
          :global="global"
          width="36"
          height="36"
        />
        <ShowHamburger
          v-if="global"
          :phones="global.phones"
          :footer="global.footer"
          :socials="global.socials"
          :global="global"
        />
        <BaseNavigation
          class="header__navigation hidden-mobile"
          v-if="global"
          :phones="global.phones"
          :email="global.email"
        />
        <div
          v-if="searchStore.products.length"
          class="header__product-filter-card"
        >
          <ul class="header__product-card-list">
            <ProductFilterCard
              v-for="product in products"
              :key="product.documentId"
              :product="product"
            />
          </ul>
          <div class="header__pagination-product">
            <UButton
              v-for="page in totalPages"
              :key="page"
              variant="pagination"
              :label="page"
              @click="searchStore.changePage(page)"
              :class="{ 'pagination-active': currentPage === page }"
            />
          </div>
        </div>
      </div>
    </div>
  </header>

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

  <!-- AI Ассистент для всех пользователей -->
  <ChatAssistant />
</template>

<style lang="scss" scoped>
.header {
  //   background-color: var(--success-color);
  padding-block-end: toRem(22);

  &__container-top {
    display: grid;
    grid-template-columns: auto auto 1fr auto auto;
    align-items: center;
    column-gap: toRem(22);
    padding-block: toEm(16);
    transition: opacity var(--transition-duration);
    @include adaptiveValue("height", 65, 55);

    @media (max-width: $mobile) {
      grid-template-columns: auto 1fr;
    }
  }

  &__logo {
    justify-self: start;
  }

  &__search {
    justify-self: end;
    width: 80%;

    @media (max-width: $mobile) {
      width: 100%;
      grid-column: 2/3;
      grid-row: 1/2;
    }
  }

  &__cart {
    translate: 0 toRem(3);

    @media (max-width: $mobile) {
      grid-column: 1/2;
      grid-row: 1/2;
    }
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
      grid-column: 2/3;
      grid-row: 1/2;
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
    background-color: var(--bg-navigation);
  }

  &__container-bottom {
    //  display: grid;
    //  grid-template-columns: auto 1fr;
    display: flex;
    justify-content: space-between;
    align-items: center;
    @include adaptiveValue("height", 64, 44);

    @media (min-width: $mobile) {
      position: relative;
      display: grid;
      grid-template-columns: auto 1fr;
    }

    @media (max-width: $mobile) {
      // grid-template-columns: auto 1fr;
      padding-block: toRem(6);
    }
  }

  &__navigation {
    justify-self: end;
  }

  &__product-filter-card {
    position: absolute;
    z-index: 9999;
    right: toEm(8);
    top: toEm(0);
    display: grid;
    grid-template-columns: 1fr;
    row-gap: toRem(12);
    padding-inline: toEm(12);
    padding-block: toEm(18);
    border-radius: toRem(4);
    border: toRem(2) solid var(--primary-color);
    background-color: var(--secondary-color);

    @media (max-width: $mobile) {
      max-width: 80%;
      margin-inline: toEm(12);
      right: 0;
      top: toEm(171);
    }

    @media (max-width: $mobileSmall) {
      top: toEm(164);
    }
  }

  &__product-card-list {
    overflow-y: auto;
    @include adaptiveValue("height", 620, 390);
  }

  &__pagination-product {
    align-self: end;
    justify-self: end;
    display: flex;
    column-gap: toEm(12);
  }

  .pagination-active {
    background-color: var(--active-color);
  }
}
</style>
