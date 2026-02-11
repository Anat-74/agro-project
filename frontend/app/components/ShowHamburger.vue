<script setup lang="ts">
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
import { discountProductTranslations } from "~/locales/discountProduct";
import { buttonTranslations } from "~/locales/button";
import { showHamburgerTranslations } from "~/locales/showHamburger";

interface Props {
  footer: FooterData;
  socials: SocialLink[];
  phones: Phone[];
  global: any;
}

defineProps<Props>();

const dialogElement = useTemplateRef<HTMLDialogElement>("dialog-hamburger");

// Создаем отдельное состояние для изначальной видимости
const { open, close, isOpen } = useDialog(dialogElement, {
  useShowMethod: true,
});

const { currentLocale } = useLocale();
const config = useRuntimeConfig();
const { find } = useStrapi();

const {
  data: category,
  pending: pendingCategories,
  error,
  refresh: refreshCategory,
} = useAsyncData(`category-dialog-${currentLocale.value}`, async () => {
  const response = await find<Category>("categories", {
    filters: {
      locale: currentLocale.value,
    },
    populate: {
      image: {
        fields: ["alternativeText", "url"],
      },
      subcategories: {
        fields: ["id", "name", "slug"],
      },
      products: {
        fields: ["id", "name", "slug"],
        populate: {
          image: {
            fields: ["alternativeText", "url"],
          },
        },
      },
    },
  });

  if (!response.data || response.data.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Category - Not Found",
    });
  }
  return response.data;
});

const {
  data: product,
  pending: pendingProducts,
  refresh: refreshProduct,
} = useAsyncData(`product-dialog-${currentLocale.value}`, async () => {
  const response = await find<Product>("products", {
    filters: {
      locale: currentLocale.value,
      isDiscount: true,
    },
    fields: ["id", "name", "isDiscount", "slug"],
    pagination: {
      pageSize: 100,
    } as PaginationMeta,
    populate: {
      image: {
        fields: ["alternativeText", "url"],
      },
      subcategory: {
        fields: ["id", "name", "slug"],
        populate: {
          category: {
            fields: ["id", "name", "slug"],
          },
        },
      },
    },
  });

  if (!response.data || response.data.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product - Not Found",
    });
  }
  return response.data;
});

const pending = computed(
  () => pendingCategories.value || pendingProducts.value,
);

watch(currentLocale, () => {
  refreshCategory();
  refreshProduct();
});

</script>

<template>
  <div class="hamburger-menu">
    <UButton
      @click="isOpen ? close() : open()"
      :is-open="isOpen"
      variant="hamburger"
      :aria-label="isOpen ? buttonTranslations[currentLocale].ariaLabelDialogClosed : buttonTranslations[currentLocale].ariaLabelDialogOpen"
    />
    <span
      :class="[
        'hamburger-menu__categories',
        { 'hamburger-menu__categories_is-open': isOpen },
      ]"
      >{{ showHamburgerTranslations[currentLocale].title }}
    </span>
  </div>
  <dialog
    class="dialog-hamburger"
    ref="dialog-hamburger"
    id="dialogHamburger"
  >
    <Loader v-if="pending" />
    <h2 class="visually-hidden">
      {{ visuallyHiddenTranslations[currentLocale].showModalMenuTitle }}
    </h2>
    <div class="dialog-hamburger__items">
      <div class="dialog-hamburger__top visible-mobile">
        <Logo
          :global="global"
          :currentLocale="currentLocale"
          :config="config"
          width="32"
          height="32"
        />
        <AnimateTitle />
      </div>
      <ul v-if="category?.length" class="dialog-hamburger__accordion accordion">
        <li v-for="cat in category" :key="cat.id" class="accordion__item">
          <details name="faq" class="accordion__details">
            <summary class="accordion__summary">
              <UImage
                v-if="cat.image?.length"
                :src="cat.image[0]?.url"
                :alt="cat.name"
                class="accordion__product-image"
                width="44"
                height="32"
                type="icon"
              />
              <h3 class="accordion__product-title">{{ cat.name }}</h3>
              <Icon name="mdi:chevron-left" />
            </summary>
          </details>

          <div class="accordion__content">
            <ul class="accordion__product-list">
              <!-- <li
                v-for="sub in cat.subcategories"
                :key="sub.id"
                class="accordion__product-item"
              >
                <NuxtLink
                  class="accordion__product-link"
                  @click="close()"
                  :to="`/${currentLocale}/${cat.slug}/${sub.slug}`"
                  >
                  {{ sub.name }}
                </NuxtLink>
              </li> -->
              <!-- Отображение продуктов, принадлежащих напрямую категории -->
              <li
                v-for="prod in cat.products"
                :key="prod.id"
                class="accordion__product-item"
              >
                <NuxtLink
                  class="accordion__product-link"
                  :to="`/${currentLocale}/${prod?.subcategory?.category?.slug}/products/${prod.slug}`"
                >
                  <UImage
                    v-if="prod.image?.length"
                    :src="prod.image[0]?.url"
                    :alt="prod.name"
                    class="accordion__product-image-link"
                    width="32"
                    height="32"
                    type="icon"
                  />
                  <h4 class="accordion__product-sub-title">{{ prod.name }}</h4>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </li>
      </ul>

      <div v-if="product?.length" class="accordion">
        <details name="faq" class="accordion__details">
          <summary class="accordion__summary accordion__summary_is-discount">
            <Icon
              class="accordion__discount-icon"
              name="mdi:discount-outline"
            />
            <h4 class="accordion__product-sub-title">
              {{ discountProductTranslations[currentLocale].discount }}
            </h4>
            <Icon name="mdi:chevron-left" />
          </summary>
        </details>

        <div class="accordion__content">
          <ul class="accordion__product-list">
            <li
              class="accordion__product-item"
              v-for="prod in product"
              :key="prod.id"
            >
              <NuxtLink
                class="accordion__product-link accordion__product-link_is-discount"
                @click="close()"
                :to="`/${currentLocale}/${prod?.subcategory?.category?.slug}/products/${prod.slug}`"
              >
                <UImage
                  v-if="prod.image?.length"
                  :src="prod.image[0]?.url"
                  :alt="prod.name"
                  class="accordion__product-image-link"
                  width="32"
                  height="32"
                  type="icon"
                />
                <h4 class="accordion__product-sub-title">{{ prod.name }}</h4>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="dialog-hamburger__contacts">
        <div
          class="dialog-hamburger__phones"
          v-for="item in phones"
          :key="item.id"
        >
          <Icon v-if="item.isMobile" name="et:phone" />

          <Icon v-if="!item.isMobile" name="carbon:phone-ip" />
          <a
            :href="`tel:${item.phoneNumber.replace(/[^0-9+]/g, '')}`"
            class="company__link-phones"
            >{{ formatPhone(item.phoneNumber) }}
          </a>
        </div>
      </div>
    </div>
    <div class="dialog-hamburger__sidebar sidebar visible-mobile">
      <UButton
        @click="close()"
        :is-open="isOpen"
        variant="hamburger"
        :aria-label="buttonTranslations[currentLocale].ariaLabelDialogClosed"
      />
      <LangSwitcher />
      <ClientOnly>
        <ColorMode />
      </ClientOnly>
      <Socials
       :is-open="isOpen" 
       :socials="socials" 
       />
    </div>
  </dialog>
  <span v-if="error" class="error">
    {{ error.message }}
  </span>
</template>

<style lang="scss" scoped>
.hamburger-menu {
  height: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  justify-items: center;
  align-items: center;
  border-left: toEm(9) solid var(--bg);
  border-right: toEm(9) solid var(--bg);
  background-color: var(--whitesmoke-color);
  @include adaptiveValue("width", 320, 235);

  @media (max-width: $mobile) {
    height: 90%;
    width: toRem(150);
    direction: rtl;
    border-left: 0;
    border-right: 0;
    border-radius: toEm(4) toEm(25) 0 toEm(25);
  }

  &__categories {
    font-size: toEm(24);
    color: var(--success-color);
    transition: color var(--transition-duration);

    &_is-open {
      color: var(--danger-hover);
    }
  }
}

.dialog-hamburger {
  display: grid;
  grid-template-columns: 1fr auto;
  z-index: 9999;
  top: 0;
  height: 100%;
  width: 100dvw;
  translate: -100%;
  margin-inline-start: 0;
  background-color: transparent;
  backdrop-filter: blur(22px);
  transition: translate var(--transition-duration);

  @media (min-width: $mobile) {
    height: toEm(632);
    scale: 0;
    translate: 0;
    top: calc(100% + toRem(22));
    margin-inline-end: 0;
    left: toRem(15);
    border-radius: toEm(4);
    border-width: 0 toEm(3) toEm(3) toEm(3);
    border-style: solid;
    border-color: var(--border-color-transparent);
    transition: scale 0.1s linear;
    @include adaptiveValue("width", 316, 235);
  }

  &[open] {
    translate: 0;
    transition: translate var(--transition-duration);

    @media (min-width: $mobile) {
      scale: 1;
      transition: scale 0.1s linear;
    }
  }

  &__items {
    display: flex;
    flex-direction: column;
    row-gap: toEm(16);
    padding-inline: toEm(16);
    padding-block-start: toEm(22);
    padding-block-end: toEm(12);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--success-color) var( --whitesmoke-color);

    @media (max-width: $mobile) {
      justify-items: center;
      align-items: center;
      min-height: 100dvh;
      // @include adaptiveValue("padding-inline", 299, 12);
      // @include adaptiveValue("padding-block", 222, 32);
    }
  }

  &__top {
    width: 90%;
    display: grid;
    grid-template-columns: auto 1fr;
    padding-inline: toEm(12);
    padding-block: toEm(2);
    border-radius: toEm(25);
    background-color: var(--light-color);

    @media (max-width: $mobileSmall) {
      width: 100%;
    }
  }

  &__accordion {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    row-gap: toEm(16);

    @media ($mobileSmall <= width <= $mobile) {
      width: 70%;
    }
  }

  &__phones {
    justify-self: end;
    display: flex;
    align-items: center;
    column-gap: toEm(4);
    padding-inline: toEm(8);
    padding-block: toEm(4);
    border-radius: toRem(4);
    font-weight: 600;
    color: var(--warning-color);
    background-color: var(--border-color-transparent);
    transition: all var(--transition-duration);

    &:not(:last-child) {
      margin-block-end: toEm(6);
    }

    svg {
      font-size: toRem(22);
      color: var(--danger-color);
    }

    @include hover {
      text-decoration: underline;
      svg {
        color: var(--danger-color);
      }
    }
  }

  &__sidebar {

  }
}

.accordion {
  &__details {
    padding-block: toRem(2);

    svg {
      font-size: toRem(22);
    }
  }

  &__details[open] + &__content {
    grid-template-rows: 1fr;
  }

  &__details[open] {
    .accordion__summary {
      color: var(--danger-color);

      svg {
        rotate: -180deg;
        transition: rotate var(--transition-duration);
      }
    }
  }

  &__details:not([open]) {
    .accordion__summary {
      svg {
        transition: rotate var(--transition-duration);
      }
    }
  }

  &__summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: toEm(4);
    font-weight: 600;
    font-size: toEm(22);
    color: var(--primary-color);
    border-radius: toEm(6);
    outline: toRem(2) var(--whitesmoke-color) inset;
    border-radius: toRem(4);
    background-color: var(--light-color-transparent);

    svg {
      rotate: -90deg;
    }

    @include hover {
      color: var(--warning-color);
    }

    &_is-discount {
      padding-inline: toEm(4);
      padding-block: toRem(6);
      outline: toRem(2) var(--light-color) outset;
      color: var(--danger-color);

      svg {
        color: var(--green-color);
      }

      @include hover {
        color: var(--danger-hover);
      }
    }
  }

  &__content {
    display: grid;
    grid-template-rows: 0fr;
    transition: all 0.3s;
  }

  &__product-list {
    overflow: hidden;
    color: var(--color);
  }

  &__product-link {
    display: grid;
    grid-template-columns: auto 1fr;
    justify-items: center;
    align-items: center;
    border-radius: toRem(8);
    padding-block-start: toRem(16);
    transition: all var(--transition-duration);

    &_is-discount {
      column-gap: toEm(4);
    }

    @include hover {
      color: var(--gray-color);
      text-decoration: underline;
    }
  }

  &__product-sub-title {
    font-weight: 800;
  }

  .router-link-active {
    cursor: default;
    text-decoration: none;
    font-weight: 600;
    color: var(--danger-hover);
  }
}

.sidebar {
  display: grid;
  grid-template-rows: repeat(3, auto) 1fr;
  justify-items: center;
  row-gap: toEm(18);
  overflow-y: auto;
  padding-inline: toEm(4);
  padding-block: toEm(12);
  border-left: toEm(2) solid var(--success-color);
  background-color: var(--secondary-color);
}
</style>
