<script setup lang="ts">
import type {
  Category,
  Product,
  PaginationMeta,
  FooterData,
  SocialLink,
  Phone,
} from "../types/types";
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
import { discountProductTranslations } from "~/locales/discountProduct";

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
      :is-open="isOpen"
      variant="hamburger"
      aria-label="Открыть - закрыть"
    />
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
      <div class="dialog-hamburger__top visible-mobile">
        <Logo
          :global="global"
          :currentLocale="currentLocale"
          :config="config"
          :width="40"
          :height="40"
        />
        <AnimateTitle />
      </div>
      <ul v-if="category?.length" class="dialog-hamburger__accordion accordion">
        <li v-for="cat in category" :key="cat.id" class="accordion__item">
          <details name="faq" class="accordion__details">
            <summary class="accordion__summary">
              <Icon name="mdi:chevron-left" />
              <span>{{ cat.name }}</span>
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
    </div>
    <div class="dialog-hamburger__sidebar sidebar visible-mobile">
      <LangSwitcher class="sidebar__lang" />
      <ClientOnly>
        <ColorMode class="sidebar__color-mode" />
      </ClientOnly>
         <UButton
        @click="close()"
        :is-open="isOpen"
        class="sidebar__close"
        variant="hamburger"
        aria-label="Закрыть"
      />
      <Socials class="sidebar__socials" :is-open="isOpen" :socials="socials" />
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
  border-left: toEm(3) solid var(--secondary-color);
  border-right: toEm(3) solid var(--secondary-color);
  background-color: var(--light-color);
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
   width: 100vw;
   translate: -100%;
   margin-inline-start: 0;
   background-color: transparent;
   transition: translate var(--transition-duration);

  @media (min-width: $mobile) {
    scale: 0;
    translate: 0;
    top: 100%;
    margin-inline-end: 0;
    left: toRem(15);
    background-color: transparent;
    border-radius: toEm(4);
    border: toEm(3) solid var(--secondary-color);
    transition: scale .1s linear;
    @include adaptiveValue("width", 320, 235);
  }

  &[open] {
      translate: 0;
      transition: translate var(--transition-duration);

      @media (min-width:$mobile){
       scale: 1;
       transition: scale .1s linear;
      }
  }

  //   &:not([open]) {
  //     scale: 0;
  //     transition: scale .1s linear;
  //   }

  &__items {
    min-height: toRem(400);
    display: flex;
    flex-direction: column;
    row-gap: toEm(16);
    padding-inline: toEm(8);
    padding-block-start: toEm(4);
    padding-block-end: toEm(16);
    backdrop-filter: blur(16px);

    @media (max-width: $mobile) {
      min-height: 100dvh;
      padding-inline: toEm(18);
      padding-block: toEm(12);
    }
  }

  &__top {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    padding-inline: toEm(12);
    padding-block: toEm(2);
    border-radius: toEm(25);
    background-color: var(--light-color);
  }

  &__accordion {
    flex: 1 1 auto;
  }

  &__phones {
    align-self: center;
    display: flex;
    align-items: center;
    column-gap: toEm(4);
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
        transform: rotate(-90deg);
        transition: transform 0.3s;
      }
    }
  }

  &__summary {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    padding-block: toRem(4);
    font-weight: 600;
    font-size: toEm(22);
    color: var(--primary-color);
    transition: color var(--transition-duration);

      // outline: toRem(2) var(--success-color) outset;
      // border-radius: toRem(4);
      // background-color: var(--light-color);

   //  span {
   //    padding: toRem(2) toRem(12);
   //    outline: toRem(2) var(--success-color) inset;
   //    border-radius: toRem(8);
   //    background-color: var(--light-color);
   //  }

    svg {
      position: absolute;
      top: 50%;
      left: 0;
      translate: 0 -50%;
    }

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
    color: var(--color);
  }

  &__product-link {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: toEm(20);
    border-radius: toRem(8);
    margin-block-start: 0;
    margin-block-end: toRem(6);
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

.sidebar {
  position: relative;
  display: grid;
  grid-template-rows: repeat(2, auto) 1fr;
  justify-items: center;
  row-gap: toEm(18);
  padding-inline: toEm(8);
  padding-block: toEm(12);
  border-left: toEm(2) solid var(--success-color);
  background-color: var(--secondary-color);

  &__close {
   position: absolute;
   top: 50%;
   left: 50%;
   translate: -50% -50%;
   height: auto;
   width: 100%;
   padding-inline: 0;
   padding-block: toEm(28);
   border-radius: toEm(2);
  }
}
</style>
