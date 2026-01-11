<script setup lang="ts">
import type { VisibilityState } from "../types/types";
const { find } = useStrapi();
const searchStore = useSearchStore();
const { products, totalPages, currentPage } = storeToRefs(searchStore);
const { currentLocale } = useLocale();
const config = useRuntimeConfig();
const { isContacts } = inject<VisibilityState>("visible")!;

const {
  data: global,
  error,
  refresh,
} = useAsyncData<any>(`global-${currentLocale.value}`, async () => {
  const response = await find("global", {
    filters: { locale: currentLocale.value },
  });

  if (!response.data) {
    throw createError({ statusCode: 404, message: "Global not found" });
  }

  return response.data;
});

watch(currentLocale, () => {
  refresh();
});

console.debug("global data:", global.value)
</script>

<template>
  <header class="header">
    <BannerLayouts class="header__banner" />
    <div class="header__container-top">
      <Logo
        class="header__logo hidden-mobile"
        :global="global"
        :currentLocale="currentLocale"
        :config="config"
      />
      <AnimateTitle class="hidden-mobile" />
      <ProductFilter class="header__search" />
      <Basket class="header__cart" />
    </div>
    <div class="header__bottom">
      <div class="header__container-bottom">
        <Logo
          class="header__logo visible-mobile"
          :global="global"
          :currentLocale="currentLocale"
          width="48"
          height="48"
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
        <div v-if="searchStore.products.length" class="header__product-card">
          <ul class="header__product-card-list">
            <ProductCard
              v-for="product in products"
              :key="product.id"
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

  <main :class="['main', { 'backdrop-visible': isContacts }]">
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
</template>

<style lang="scss" scoped>
.header {
  //   background-color: var(--success-color);
  padding-block-end: toRem(22);

  &__banner {
  }

  &__container-top {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
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

  &__bottom {
    background-color: var(--bg-navigation);
  }

  &__container-bottom {
    //   position: relative;
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

  &__product-card {
    position: absolute;
    z-index: 9999;
    right: toEm(8);
    top: toEm(186);
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
    @include adaptiveValue("height", 720, 390);
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
