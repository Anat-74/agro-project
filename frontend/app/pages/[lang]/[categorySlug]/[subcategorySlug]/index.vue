<script setup lang="ts">
import type { Product, ProductsResponse, Subcategory } from "@/types/types"
import { productFilterTranslations } from '~/locales/productFilter'
import { visuallyHiddenTranslations } from '~/locales/visuallyHidden'
import { buttonTranslations } from '~/locales/button'
import { formatPrice } from '~/utils/formatPrice'

const { find } = useStrapi()
const route = useRoute()
const { currentLocale } = useLocale()
const { goBack, goForward } = useGoToForwardOrBack()
const { isInCart } = useIsInCart()
const cartStore = useCartStore()
const config = useRuntimeConfig()
const { width } = useViewport()

const sortOption = ref<string>('name:asc')
const page = ref(route.query.page ? +route.query.page : 1) // Текущая страница из query-параметра
const pageSize = 12 // Количество товаров на странице

const { categorySlug, subcategorySlug } = route.params as {
  categorySlug: string
  subcategorySlug: string
}

// Параллельная загрузка подкатегории и продуктов
const { data, pending, error, refresh } = useAsyncData(
  `subcategory-products-${currentLocale.value}-${categorySlug}-${subcategorySlug}-${page.value}-${sortOption.value}`,
  async () => {
    // Параллельная загрузка данных
    const [subcategoryRes, productsRes] = await Promise.all([
      // Запрос подкатегории
      find('subcategories', {
        filters: {
          slug: { $eq: subcategorySlug },
          category: { slug: { $eq: categorySlug } },
          locale: currentLocale.value
        },
        fields: ['id', 'name']
      }),
      
      // Запрос продуктов с фильтрацией по slug
      find('products', {
        filters: {
          subcategory: {
            slug: { $eq: subcategorySlug },
            category: { slug: { $eq: categorySlug } }
          },
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

    // Обработка ошибок подкатегории
    if (!subcategoryRes.data || subcategoryRes.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Products subCategory Not Found'
      })
    }

    return {
      subcategory: subcategoryRes.data[0] as Subcategory,
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
const subcategory = computed(() => data.value?.subcategory)
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
  if (subcategory.value) {
    useSeoMeta({
      title: subcategory.value.name,
      description: subcategory.value.name
    })
  }
})

const handleAddToCart = (product: Product) => {
  cartStore.addToCart(
    product,
     subcategorySlug,
     categorySlug
  )
}
</script>

<template>
  <Loader v-show="isLoading" 
  class="loader"
  />
  <section 
    v-show="!isLoading"
    class="subcategory-products"
    aria-labelledby="subcategory-products"
  >
    <div class="subcategory-products__row-top">
      <UButton
        @click="goBack"
        icon="material-symbols:arrow-back"
        :aria-label="buttonTranslations[currentLocale].ariaLabelGoBack"
        name-class="go-forward-back"
      />
      <UButton
        @click="goForward"
        icon="material-symbols:arrow-forward"
        :aria-label="buttonTranslations[currentLocale].ariaLabelGoForward"
        name-class="go-forward-back"
      />
      <div class="subcategory-products__select-wrapper select-wrapper">
        <label 
          class="visually-hidden"
          for="sort-subcategory-product"
        >
          {{ productFilterTranslations[currentLocale].labelSelect }}
        </label>
        
        <select 
          class="subcategory-products__select select"
          v-model="sortOption"
          id="sort-subcategory-product"
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
    <h1 class="subcategory-products__subcategory-title"
     id="subcategory-products"
    >
         {{ subcategory?.name }}
      </h1>
    <h2 class="visually-hidden">{{ visuallyHiddenTranslations[currentLocale].sectionSubcategorySlugList }}</h2>
    <ul
      v-if="products?.data.length" 
      class="subcategory-products__list"
    >
      <li 
        v-for="(product, index) in products.data" 
        :key="product.id"
        class="subcategory-products__item"
      >
      <Icon 
      v-if="product.isDiscount"
      class="subcategory-products__discount-icon"
      name="mdi:discount" />
      <ProductStatus 
      :product="product"
      class="subcategory-products__in-stock"
     />
        <NuxtLink 
          class="subcategory-products__link"
          :to="`/${currentLocale}/${categorySlug}/${subcategorySlug}/${product.slug}`"
        >
          <NuxtImg 
            class="subcategory-products__image"
            v-if="product.image?.length"
            :src="`${config.public.strapi.url}${product.image[0]?.url}`"
            :alt="product.name"
            :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
            :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
            decoding="async"
            width="258"
            height="194"
            format="webp"
          />
        </NuxtLink>
        
        <div class="subcategory-products__items-bottom">
          <h3 class="subcategory-products__title">
            {{ product.name }}
          </h3>
          
          <span
          :class="['subcategory-products__price', {'subcategory-products__price_discount': product.isDiscount}]"
          >
            {{ formatPrice(product.price) }}
          </span>

          <UButton 
            v-if="!isInCart(product.id)"
            @click="handleAddToCart(product)"
            class="subcategory-products__add-to-cart"
            name-class="small-add-to-cart"
            icon="qlementine-icons:add-to-cart-16"
            :aria-label="buttonTranslations[currentLocale].label"
          />
          
          <UButton 
            class="subcategory-products__add-to-cart"
            v-else
            disabled
            name-class="small-add-to-cart"
            icon="emojione-v1:left-check-mark"
            :aira-label="buttonTranslations[currentLocale].ariaLabelAdded"
          />
        </div>
      </li>
    </ul>

    <Pagination 
      v-if="pageCount > 1"
      class="subcategory-products__pagination"
      :page="page"
      :pageCount="pageCount"
      :routeName="route.name?.toString() || ''"
    />
  </section>

  <span v-if="error" class="error">
    {{ error.message }}
  </span>
</template>

<style lang="scss" scoped>
.subcategory-products {
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

&__subcategory-title {
   color: var(--dark-golden-color);
   @include adaptiveValue("margin-block-end", 66, 32);
}

&__list {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(toRem(262), 1fr));
   justify-items: center;
   row-gap: toEm(32);
   @include adaptiveValue("column-gap", 64, 7);

   @media (max-width:toEm(568)){
      grid-template-columns: repeat(2, 1fr);
   }
}

&__item {
   position: relative;
   justify-self: center;
   display: grid;
   min-height: 100%;
   width: 100%;
   padding-block-end: toEm(18);
   box-shadow: 0px 1px 2px 0px var(--shadow);
   border-radius: toEm(4);
   background-color: var(--bg-product);
}

&__discount-icon {
   position: absolute;
   top: toEm(2);
   left: toEm(2);
   color: var(--lime-color);
   font-size: toEm(27);
}

&__in-stock {
   justify-self: end;
   padding: toEm(4);
}

&__link {
   display: flex;
   justify-content: center;
   margin-block: toEm(4);
   transition: scale var(--transition-duration);

@include hover {
.subcategory-products__image {
   outline: toRem(3) solid var(--secondary-color);
   outline-offset: toRem(1);
   border-radius: toRem(12);
      }
   }
}

&__image {
   @media (max-width: toEm(628)){
      width: toRem(322);
}
}

&__items-bottom {
   display: flex;
   flex-direction: column;
   position: relative;
   padding-inline: toEm(16);
   @include adaptiveValue("padding-inline", 16, 2);
}

&__title {
   flex: 1 1 auto;
   text-align: center;
   margin-block-end: toEm(18);
}

&__price {
   padding-inline-start: toEm(12);
   padding-block: toRem(7);
   font-weight: 600;
   color: var(--warning-color);
   background-color: var(--secondary-color);
   border-radius: toRem(14);

   &_discount {
      font-weight: 600;
      color: var(--lime-color);
   }
}

&__add-to-cart {
   position: absolute;
   right: toRem(17);
   bottom: toRem(3);
   @include adaptiveValue("right", 17, 4);
   }

   &__pagination {
      justify-self: end;
   }
}
</style>