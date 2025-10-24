<script setup lang="ts">
import type { Category, Product, PaginationMeta, FooterData, SocialLink, Phone } from "../types/types"
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
import { discountProductTranslations } from '~/locales/discountProduct'

defineProps<{
   footer: FooterData
   socials: SocialLink[]
   phones: Phone[]
}>()


const dialogElement = useTemplateRef<HTMLDialogElement>('dialog-menu')
const { isOpen, open, close } = useDialog(dialogElement)

const { currentLocale } = useLocale()
const { formatPhone } = useFormatPhone()
const config = useRuntimeConfig()
const { find } = useStrapi()

const { data: category, pending: pendingCategories, error, refresh: refreshCategory } = useAsyncData(
  `category-dialog-${currentLocale.value}`,
  async () => {
     const response = await find<Category>('categories', {
       filters: {
         locale: currentLocale.value
       },
      populate: {
        subcategories: {
            fields: ['id', 'name', 'slug']
        }
       }
    })


    if (!response.data || response.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Category - Not Found'
      })
     }
    return response.data
   }
)


const { data: product, pending: pendingProducts, refresh: refreshProduct } = useAsyncData(
  `product-dialog-${currentLocale.value}`,
  async () => {
     const response = await find<Product>('products', {
       filters: {
         locale: currentLocale.value,
         isDiscount: true,
       },
       fields: ['id', 'name', 'isDiscount', 'slug'],
       pagination: {
        pageSize: 100
      } as PaginationMeta,
        populate: {
         image: {
          fields: ["alternativeText", "url"]
        },
         subcategory: {
         fields: ['id', 'name', 'slug'],
         populate: {
            category: {
               fields: ['id', 'name', 'slug'],
               }
            }
         }
      }
    })


    if (!response.data || response.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Product - Not Found'
      })
     }
    return response.data
   }
)

const pending = computed(() => pendingCategories.value || pendingProducts.value)

// Реакция на смену языка
watch(currentLocale, () => {
  refreshCategory()
  refreshProduct()
})
</script>

<template>
   <UButton 
   @click="open()"
   icon="line-md:arrow-open-left"
   name-class="dialog-menu"
   aria-label="open"
   />
   <dialog 
   class="dialog-menu"
   ref="dialog-menu"
   id="dialogMenu" 
   aria-label="Menu" 
   >
   <Loader v-if="pending" />
   <h1
         class="visually-hidden"
         >{{ visuallyHiddenTranslations[currentLocale].showModalMenuTitle }}</h1>
     <div class="dialog-menu__items">
         <UButton 
         @click="close()"
         name-class="close"
         aria-label="closed"
          />
         <div class="dialog-menu__top">
      <NuxtLink class="dialog-menu__logo"
      :to="`/${currentLocale}`">
      <NuxtImg
         v-if="footer.logo?.length"
         class="base-footer__logo"
         :src="`${config.public.strapi.url}${footer.logo[0]?.url}`"
         :alt="footer.companyName"
         format="webp"
         width="55"
         aria-label="Go home"
    />
   </NuxtLink>
   <AnimateTitle />
</div>
         <ul
         v-if="category?.length"
         class="dialog-menu__accordion accordion">
         <li 
          v-for="cat in category"
         :key="cat.id"
         class="accordion__item">
         <details 
            name="faq" 
            class="accordion__details"
         >
           <summary 
           class="accordion__summary">
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
                  </ul>
               </div>
            </li>
      </ul>

      <div v-if="product?.length"
      class="accordion"
      >
         <details 
            name="faq" 
            class="accordion__details"
         >
           <summary 
           class="accordion__summary">
           <Icon name="mdi:chevron-left" />
           <span>
           <Icon class="accordion__discount-icon"
           name="mdi:discount-outline" />
           {{ discountProductTranslations[currentLocale].discount }}
         </span>
         </summary> 
         </details>

         <div class="accordion__content">
         <ul class="accordion__product-list">
            <li class="accordion__product-item"
            v-for="prod in product"
            :key="prod.id">
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
      class="dialog-menu__phones"
      v-for="item in phones" 
      :key="item.id"
      >
         <Icon
          v-if="item.isMobile"
         name="et:phone"
         />

         <Icon
          v-if="!item.isMobile"
         name="carbon:phone-ip"
         />
    <a
    :href="`tel:${item.phoneNumber.replace(/[^0-9+]/g, '')}`"
    class="company__link-phones"
    >{{ formatPhone(item.phoneNumber) }}
    </a>
   </div>

      <div class="dialog-menu__socials"
    v-if="socials"
   >
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
     </div>
   </dialog>
<span v-if="error" class="error">
      {{ error.message }}
    </span>
 </template>

<style lang="scss" scoped>
.dialog-menu {
  min-height: 100dvh;
  display: block;
  position: fixed;
  inset: 0;
  margin-inline-end: 0;
  translate: 100% 0;
  background-color: var(--bg);
  transition: translate .2s linear;
    @include adaptiveValue('width', 855, 295);

  &[open] {
   translate: 0;
   transition: translate .2s linear;
  }
  &[open]::backdrop {
   background-color: var(--dark-color);
   opacity: .1;
   // animation: fade .2s linear forwards;
  }

  &__items {
   min-height: 100dvh;
   display: flex;
   flex-direction: column;
   row-gap: toEm(18);
   padding-block: toEm(16);
   padding-inline: toEm(7);
   background:linear-gradient(-135deg, transparent toRem(45), var(--secondary-color) 0);
   @include adaptiveValue('padding-inline', 32, 12);
  }

  &__top {
   position: relative;
   display: flex;
  }

  &__logo {
   border-radius: 50%;
   padding-inline: toEm(4);
   padding-block: toEm(6);
   outline: 1px solid var(--light-color);
   outline-offset: toRem(2);
   background-color: var(--light-color);

   @media (max-width:$mobile){
       width: toEm(47); 
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
      font-size: toEm(22);
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
}

.accordion {
      &__details {
         margin-block-end: toEm(2);
         svg {
            font-size: toEm(22);
         }
      }

      &__details[open] +
      &__content {
         grid-template-rows: 1fr;
      }

      &__details[open] {
         .accordion__summary {
            color: var(--danger-color);

            svg {
               transform: rotate(-90deg);
               transition: transform .3s;
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
         font-size: toEm(20);
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
         transition: all .3s;
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
         font-size: toEm(18);
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

         @media (max-width:$mobile){
             width: toRem(77); 
         }
      }

      .router-link-active {
      color: var(--danger-hover);
   }
   }

// @keyframes fade {
//    0% {
//       opacity: 0;
//    }
//    100% {
//       opacity: .2;
//    }
// }
</style>