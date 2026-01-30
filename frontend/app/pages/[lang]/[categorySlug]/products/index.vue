<script setup lang="ts">
import type { Category, Product, ProductsResponse } from "@/types/types"
import { productFilterTranslations } from '~/locales/productFilter'
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
import { buttonTranslations } from '~/locales/button'
import { tooltipTranslations } from '~/locales/tooltip'
import { formatPrice } from '~/utils/formatPrice'

const { find } = useStrapi()
const route = useRoute()
const { categorySlug } = route.params as { categorySlug: string }
const { currentLocale } = useLocale()
const { goBack, goForward } = useGoToForwardOrBack()
const { isInCart } = useIsInCart()
const cartStore = useCartStore()
const config = useRuntimeConfig()
const { width } = useViewport()

const sortOption = ref<string>('name:asc')
const page = ref(route.query.page ? +route.query.page : 1) // Текущая страница из query-параметра
const pageSize = 12 // Количество товаров на странице

// Загрузка категории и продуктов напрямую
const { data, pending, error, refresh } = useAsyncData(
  `category-products-${currentLocale.value}-${categorySlug}-${page.value}-${sortOption.value}`,
  async () => {
    // Параллельная загрузка данных
    const [categoryRes, productsRes] = await Promise.all([
      // Запрос категории
      find('categories', {
        filters: {
          slug: { $eq: categorySlug },
          locale: currentLocale.value
        },
        fields: ['id', 'name']
      }),
      
      // Запрос продуктов с фильтрацией по slug категории
      find('products', {
        filters: {
          category: { slug: { $eq: categorySlug } },
          locale: currentLocale.value
        },
        populate: {
          image: {
            fields: ["alternativeText", "url"]
          }
        },
        sort: sortOption.value,
        pagination: {
          page: page.value,
          pageSize: pageSize
        }
      })
    ])

    // Обработка ошибок категории
    if (!categoryRes.data || categoryRes.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Category Not Found'
      })
    }

    return {
      category: categoryRes.data[0] as Category,
      products: productsRes as ProductsResponse
    }
  }
)

const visibleImagesCount = computed(() => {
  if (width.value < 565.98) return 2
  if (width.value < 878.98) return 4
  if (width.value < 1215.98) return 6
  return 10
})

// Разделение данных
const category = computed(() => data.value?.category)
const products = computed(() => data.value?.products)

// Флаг загрузки
const isLoading = ref(pending)

// Количество страниц
const pageCount = computed(() => {
  return products.value?.meta?.pagination?.pageCount || 1;
})

// Обработчик изменения страницы
watch(() => route.query.page, (newPage) => {
  page.value = newPage ? +newPage : 1;
  refresh() // Перезагружаем данные
})

// Обработчик сортировки
watch(sortOption, () => {
  refresh() // Перезагружаем данные
});

// SEO
watchEffect(() => {
  if (category.value) {
    useSeoMeta({
      title: category.value.name,
      description: category.value.name
    })
  }
})

const handleAddToCart = (product: Product) => {
  cartStore.addToCart(
    product,
    categorySlug,
    null // subcategorySlug - null, так как продукт принадлежит напрямую категории
  )
}
</script>

<template>
  <Loader v-show="isLoading" 
  class="loader"
  />
  <section 
    v-show="!isLoading"
    class="products-section"
    aria-labelledby="products-section"
  >
  <div class="products-section__container">
    <div class="products-section__row-top">
      <UButton
        @click="goBack"
        icon="material-symbols:arrow-back"
        :aria-label="buttonTranslations[currentLocale].ariaLabelGoBack"
        variant="go-forward-back"
      />
      <UButton
        @click="goForward"
        icon="material-symbols:arrow-forward"
        :aria-label="buttonTranslations[currentLocale].ariaLabelGoForward"
        variant="go-forward-back"
      />
      <div class="products-section__select-wrapper select-wrapper">
        <label 
          class="visually-hidden"
          for="sort-product"
        >
          {{ productFilterTranslations[currentLocale].labelSelect }}
        </label>
        
        <select 
          class="products-section__select select"
          v-model="sortOption"
          id="sort-product"
        >
          <option 
            class="option"
            disabled
            value=""
          ></option>
          <option
            class="option"
            value="name:asc"
          >
            {{ productFilterTranslations[currentLocale].optionName }}
          </option>
          <option
            class="option"
            value="price:asc"
          >
            {{ productFilterTranslations[currentLocale].optionPrice }}
          </option>
          <option 
            class="option"
            value="price:desc"
          >
            {{ productFilterTranslations[currentLocale].optionPriceDesc }}
          </option>
        </select>
      </div>
    </div>
    <h1 class="products-section__category-title"
     id="products-section"
    >
         {{ category?.name }}
      </h1>
    <h2 class="visually-hidden">{{ visuallyHiddenTranslations[currentLocale].sectionSubcategorySlugList }}</h2>
    <ul
      v-if="products?.data.length"
      class="products-section__card-list"
    >
      <li 
        v-for="(product, index) in products.data" 
        :key="product.id"
        class="products-section__card-item"
      >
      <div class="products-section__card-top">
      <Icon 
      v-if="product.isDiscount"
      class="products-section__card-discount"
      name="mdi:discount" />
      <ProductStatus 
      :product="product"
      class="products-section__card-in-stock"
     />
     <UButton
     class="products-section__card-eye"
     variant="product-eye"
     icon="ph:eye-light"
     />
     </div>
        <NuxtLink 
          class="products-section__card-link"
          :to="`/${currentLocale}/${categorySlug}/products/${product.slug}`"
        >
          <UImage
          class="products-section__card-image"
            v-if="product.image?.length"
            :src="product.image[0]?.url"
            :alt="product.name"
            :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
            :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
            width="302"
            height="302"
          />
         <h3 class="products-section__card-title">
            {{ product.name }}
          </h3>
        </NuxtLink>
        <div class="products-section__card-bottom">
         <UTooltip 
            :text="tooltipTranslations[currentLocale].byRuble"
         >
        <Icon name="my-icon:icon-by-regular" />
      </UTooltip>
          <span
          :class="['products-section__card-price', {'products-section__card-price_discount': product.isDiscount}]"
          >
            {{ formatPrice(product.price) }}
          </span>

          <UButton 
            v-if="!isInCart(product.id)"
            @click="handleAddToCart(product)"
            class="products-section__card-add"
            variant="small-add-to-cart"
            icon="qlementine-icons:add-to-cart-16"
            :aria-label="buttonTranslations[currentLocale].label"
          />
          <UButton 
            class="products-section__card-add"
            v-else
            disabled
            variant="small-add-to-cart"
            icon="emojione-v1:left-check-mark"
            :aira-label="buttonTranslations[currentLocale].ariaLabelAdded"
          />
        </div>
      </li>
    </ul>
    <div v-else-if="!pending" class="products-section__empty">
      {{ productFilterTranslations[currentLocale].noResults }}
    </div>

    <Pagination 
      v-if="pageCount > 1"
      class="products-section__pagination"
      :page="page"
      :pageCount="pageCount"
      :routeName="route.name?.toString() || ''"
    />
    </div>
  </section>

  <span v-if="error" class="error">
    {{ error.message }}
  </span>
</template>

<style lang="scss" scoped>
.products-section {
   padding-block: toEm(12);

&__row-top {
   display: grid;
   grid-template-columns: repeat(2,auto) 1fr;
   align-items: center;
   column-gap: toRem(7);
   margin-block-end: toEm(12);
}

&__select-wrapper {
   justify-self: end;
   display: flex;
   height: 100%;
}

&__category-title {
   color: var(--warning-color);
   @include adaptiveValue("margin-block-end", 66, 32);
}

&__card-list {
   justify-items: center;
   row-gap: toEm(32);
   @include adaptiveValue("column-gap", 64, 7);
   @include gridCards(fill);

   @media (max-width:toEm(568)){
      grid-template-columns: repeat(2, 1fr);
   }
}

&__card-item {
   position: relative;
   display: grid;
   min-height: 100%;
   padding-block: toEm(12);
   border: toEm(2) solid var(--whitesmoke-color);
   border-radius: toEm(6);

   @media (max-width:$mobile){
   @media (prefers-reduced-motion: no-preference) {
   animation: scroll-animate;
   animation-timeline: view();
   animation-range: entry 0% entry 150%;
   }
}
}

&__card-top {
   display: flex;
   align-items: center;
   column-gap: toEm(4);
   padding-inline: toEm(12);
   padding-block-end: toRem(18);
}

&__card-discount {
   color: var(--success-color);
   font-size: toEm(27);
}

&__card-in-stock {
   padding: toEm(4);
}

&__card-eye {
   position: absolute;
   z-index: 10;
   right: toEm(6);
   top: toRem(32);
   padding-block: toEm(4);
   padding-inline: toEm(6);
   border-radius: 50%;
}

&__card-link {
   display: flex;
   flex-direction: column;
   align-items: center;
   row-gap: toEm(4);
   padding-inline: toEm(6);
   padding-block-end: toEm(18);

@include hover {
   .products-section__card-image {
      scale: 1.1;
    }
   .products-section__card-title {
      color: var(--warning-color);
      }
   }
}

&__card-image {
   transition: scale var(--transition-duration);
}

&__card-bottom {
   display: flex;
   align-items: center;
   padding-inline: toEm(12);
   padding-block: toEm(4);
   background-color: var(--whitesmoke-color);
}

&__card-title {
   transition: color var(--transition-duration);
   text-align: center;

}

&__card-price {
   flex: 1 1 auto;
   padding-inline-start: toEm(3);
   font-weight: 600;
   color: var(--warning-color);

   &_discount {
      font-weight: 600;
      color: var(--green-color);
   }
}

   &__pagination {
      justify-self: end;
   }
   
   &__empty {
      text-align: center;
      padding: toEm(20);
      font-size: toEm(18);
      color: var(--text-color);
   }
}
</style>

