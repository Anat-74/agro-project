<script setup lang="ts">
import type {
  Category,
  Product,
  PaginationMeta,
  FooterData,
  SocialLink,
  Phone,
} from "../types/types"
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden"
import { discountProductTranslations } from "~/locales/discountProduct"

interface Props {
  footer: FooterData;
  socials: SocialLink[];
  phones: Phone[];
  global: any;
}

defineProps<Props>()

const dialogElement = useTemplateRef<HTMLDialogElement>("dialog-hamburger")

// Создаем отдельное состояние для изначальной видимости
const { open, close, isOpen } = useDialog(dialogElement, {
  useShowMethod: true,
})

// onMounted(() => {
//   if (dialogElement.value) {
//     dialogElement.value.show()
//     isOpen.value = true;
//   }
// })

const { currentLocale } = useLocale();
const { formatPhone } = useFormatPhone();
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
      subcategories: {
        fields: ["id", "name", "slug"],
      },
      products: {
        fields: ["id", "name", "slug"],
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
  () => pendingCategories.value || pendingProducts.value
);

// Реакция на смену языка
watch(currentLocale, () => {
  refreshCategory();
  refreshProduct();
});
</script>

<template>
  <div class="hamburger-menu">
    <UButton
      @click="isOpen ? close() : open()"
      variant="hamburger"
      aria-label="open"
    >
    </UButton>
    <span
      :class="[
        'hamburger-menu__categories',
        { 'hamburger-menu__categories_is-open': isOpen },
      ]"
      >{{ "Каталог" }}
    </span>
  </div>
  <dialog
    class="dialog-hamburger"
    ref="dialog-hamburger"
    id="dialogHamburger"
    aria-label="Catalog"
  >
    <Loader v-if="pending" />
    <h1 class="visually-hidden">
      {{ visuallyHiddenTranslations[currentLocale].showModalMenuTitle }}
    </h1>
    <div class="dialog-hamburger__items">
         <div class="dialog-hamburger__top">
        <AnimateTitle class="visible-tablet" />
         <ClientOnly>
        <ColorMode class="dialog-hamburger__color-mode visible-tablet" />
      </ClientOnly>
      </div>
      <ul v-if="category?.length" class="dialog-hamburger__accordion accordion">
        <li 
         v-for="cat in category" 
         :key="cat.id" 
         class="accordion__item">
          <details name="faq" class="accordion__details">
            <summary class="accordion__summary">
              <Icon name="mdi:chevron-left" />
              {{ cat.name }}
            </summary>
          </details>

          <div class="accordion__content">
            <ul class="accordion__product-list">
              <li
                v-for="sub in cat.subcategories"
                :key="sub.id"
                class="accordion__product-item"
              >
                <NuxtLink
                  class="accordion__product-link"
                  @click="close()"
                  :to="`/${currentLocale}/${cat.slug}/${sub.slug}`"
                  >{{ sub.name }}
                </NuxtLink>
              </li>
              <!-- Отображение продуктов, принадлежащих напрямую категории -->
              <li
                v-for="prod in cat.products"
                :key="prod.id"
                class="accordion__product-item"
              >
                <NuxtLink
                  class="accordion__product-link"
                  @click="close()"
                  :to="`/${currentLocale}/${cat.slug}/products`"
                  >{{ prod.name }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </li>
      </ul>

      <div v-if="product?.length" class="accordion">
        <details name="faq" class="accordion__details">
          <summary class="accordion__summary">
            <Icon name="mdi:chevron-left" />
            <span>
              <Icon
                class="accordion__discount-icon"
                name="mdi:discount-outline"
              />
              {{ discountProductTranslations[currentLocale].discount }}
            </span>
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
                :to="`/${currentLocale}/${prod?.subcategory?.category?.slug}/${prod?.subcategory?.slug}/${prod.slug}`"
              >
                <NuxtImg
                  v-if="prod.image?.length"
                  :src="`${config.public.strapi.url}${prod.image[0]?.url}`"
                  :alt="prod.name"
                  class="accordion__product-image"
                  format="webp"
                  loading="lazy"
                  decoding="async"
                  width="88"
                  height="66"
                />
                {{ prod.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

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

      <div class="dialog-hamburger__socials" v-if="socials">
        <a
          v-for="link in socials"
          :key="link.id"
          :href="link.href"
          target="_blank"
        >
          <NuxtImg
            v-if="link.icon"
            :src="`${config.public.strapi.url}${link.icon[0]?.url}`"
            :alt="link.label"
            width="26"
            height="26"
          />
        </a>
      </div>
      <LangSwitcher class="dialog-hamburger__lang visible-tablet" />
    </div>
      <span v-if="error" class="error">
    {{ error.message }}
  </span>
  </dialog>
</template>

<style lang="scss" scoped>
.hamburger-menu {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  justify-items: center;
  height: 100%;
  border-left: toRem(2) solid var(--secondary-color);
  border-right: toRem(2) solid var(--secondary-color);
  background-color: var(--light-color);
  @include adaptiveValue("width", 320, 280);

  &__categories {
    display: flex;
    align-items: center;
    font-size: toEm(22);
    font-family: $font-family-cursive, "Yellowtail", cursive;
    color: var(--success-color);
    transition: color var(--transition-duration);
   
    &_is-open {
      color: var(--danger-hover);
    }
  }
}

.dialog-hamburger {
  display: block;
  z-index: 9999;
  left: toRem(15);
  top: 100%;
  scale: 0;
  border-radius: toRem(4);
  margin-inline-start: toRem(0);
  border: toRem(2) solid var(--secondary-color);
  border-top: none;
  background-color: transparent;
  transition: scale .1s linear;
  @include adaptiveValue("width", 320, 280);

  &[open] {
    scale: 1;
    transition: scale .1s linear;
  }

//   &:not([open]) {
//     scale: 0;
//     transition: scale .1s linear;
//   }

  &__items {
    min-height: toRem(600);
    display: flex;
    flex-direction: column;
    row-gap: toEm(16);
    padding-inline: toEm(8);
    padding-block-start: toEm(4);
    padding-block-end: toEm(16);
    backdrop-filter: blur(16px);
  }

  &__top {
   @media (max-width:$tablet){
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: toRem(8);
    border-top: toRem(2) solid var(--whitesmoke-color);
    border-bottom: toRem(2) solid var(--whitesmoke-color);
    border-radius: toRem(4);
    background-color: var(--light-color);
   }
  }

  &__accordion {
    flex: 1 1 auto;
  }

  &__phones {
    align-self: center;
    display: flex;
    align-items: center;
    column-gap: toRem(4);
    color: var(--warning-color);
    font-weight: 600;
    transition: all var(--transition-duration);

    svg {
      font-size: toRem(22);
      color: var(--warning-color);
    }

    @include hover {
      text-decoration: underline;
      svg {
        color: var(--danger-color);
      }
    }
  }

  &__socials {
    align-self: end;
    display: flex;
    column-gap: toEm(12);

    img {
      transition: scale var(--transition-duration);

      @include hover {
        scale: 1.1;
      }
    }
  }

  &__lang {
   align-self: start;
  }
}

.accordion {
  &__details {
      font-size: toRem(20);

    margin-block-end: toEm(2);
    svg {
      font-size: toEm(22);
    }
  }

  &__details[open] + &__content {
    grid-template-rows: 1fr;
  }

  &__details[open] {
    .accordion__summary {
      color: var(--danger-color);

      svg {
        transform: rotate(-90deg);
        transition: transform 0.3s;
      }
    }
  }

  &__summary {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    justify-items: center;
    grid-auto-flow: column;
    text-align: center;
    translate: toRem(-12) 0;
    cursor: pointer;
    padding-block: toEm(6, 22);
    font-weight: 600;
    font-size: toEm(16);
    color: var(--gray-color);
    transition: color var(--transition-duration);

    @include hover {
      color: var(--warning-color);
    }
  }

  &__discount-icon {
    translate: 0 toRem(7);
  }

  &__content {
    display: grid;
    grid-template-rows: 0fr;
    transition: all 0.3s;
  }

  &__product-list {
    overflow: hidden;
    display: grid;
    align-items: center;
    row-gap: toRem(9);
    justify-content: center;
    color: var(--color);
  }

  &__product-link {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-inline: toEm(4, 18);
    font-size: toEm(14);
    transition: all var(--transition-duration);

    &_is-discount {
      justify-content: start;
      column-gap: toEm(4);
    }

    @include hover {
      color: var(--dark-color);
      text-decoration: underline;
    }
  }

  &__product-image {
    margin-inline-start: toRem(-12);

    @media (max-width: $mobile) {
      width: toRem(77);
    }
  }

  .router-link-active {
    color: var(--danger-hover);
  }
}
// .hamburger--open {
//   &::before,
//   &::after {
//     background-color: var(--dark-color);
//   }
//   &::before {
//     top: calc(50% - toRem(1));
//     transform: rotate(-45deg);
//   }
//   &::after {
//     bottom: calc(50% - toRem(1));
//     transform: rotate(45deg);
//   }
// }
</style>
