<script setup lang="ts">
import { productFilterTranslations } from "~/locales/productFilter";
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
import { buttonTranslations } from "~/locales/button";

const { find } = useStrapi();
const route = useRoute();
const { categorySlug } = route.params as { categorySlug: string };
const { currentLocale } = useLocale();
const { goBack, goForward } = useGoToForwardOrBack();
const { width } = useViewport();

const sortOption = ref<string>("name:asc");
const page = ref(route.query.page ? +route.query.page : 1); // Текущая страница из query-параметра
const pageSize = 12; // Количество товаров на странице

// Загрузка категории и продуктов напрямую
const { data, pending, error, refresh } = useAsyncData(
  `category-products-${currentLocale.value}-${categorySlug}-${page.value}-${sortOption.value}`,
  async () => {
    // Параллельная загрузка данных
    const [categoryRes, productsRes] = await Promise.all([
      // Запрос категории
      find("categories", {
        filters: {
          slug: { $eq: categorySlug },
          locale: currentLocale.value,
        },
        fields: ["id", "name"],
      }),

      // Запрос продуктов с фильтрацией по slug категории
      find("products", {
        filters: {
          category: { slug: { $eq: categorySlug } },
          locale: currentLocale.value,
        },
        populate: {
          image: {
            fields: ["alternativeText", "url"],
          },
        },
        sort: sortOption.value,
        pagination: {
          page: page.value,
          pageSize: pageSize,
        },
      }),
    ]);

    // Обработка ошибок категории
    if (!categoryRes.data || categoryRes.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category Not Found",
      });
    }

    return {
      category: categoryRes.data[0] as Category,
      products: productsRes as ProductsResponse,
    };
  },
);

// Разделение данных
const category = computed(() => data.value?.category);
const products = computed(() => data.value?.products);

// Флаг загрузки
const isLoading = ref(pending);

// Количество страниц
const pageCount = computed(() => {
  return products.value?.meta?.pagination?.pageCount || 1;
});

// Обработчик изменения страницы
watch(
  () => route.query.page,
  (newPage) => {
    page.value = newPage ? +newPage : 1;
    refresh(); // Перезагружаем данные
  },
);

// Обработчик сортировки
watch(sortOption, () => {
  refresh(); // Перезагружаем данные
});

console.debug(products.value)

// SEO
watchEffect(() => {
  if (category.value) {
    useSeoMeta({
      title: category.value.name,
      description: category.value.name,
    });
  }
});
</script>

<template>
  <Loader v-show="isLoading" class="loader" />
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
          <label class="visually-hidden" for="sort-product">
            {{ productFilterTranslations[currentLocale].labelSelect }}
          </label>

          <select
            class="products-section__select select"
            v-model="sortOption"
            id="sort-product"
          >
            <option class="option" disabled value=""></option>
            <option class="option" value="name:asc">
              {{ productFilterTranslations[currentLocale].optionName }}
            </option>
            <option class="option" value="price:asc">
              {{ productFilterTranslations[currentLocale].optionPrice }}
            </option>
            <option class="option" value="price:desc">
              {{ productFilterTranslations[currentLocale].optionPriceDesc }}
            </option>
          </select>
        </div>
      </div>
      <h1 class="products-section__category-title" id="products-section">
        {{ category?.name }}
      </h1>
      <h2 class="visually-hidden">
        {{
          visuallyHiddenTranslations[currentLocale].sectionSubcategorySlugList
        }}
      </h2>
      <ul 
      v-if="products?.data.length" 
      class="products-section__card-list"
      >
        <ProductCard
          v-for="(product, index) in products.data"
          :key="product.id"
          :product="product"
          :index="index"
          :categorySlug="categorySlug"
        />
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
    grid-template-columns: repeat(2, auto) 1fr;
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
    margin-block-end: toEm(12);
  }

  &__card-list {
    justify-items: center;
    row-gap: toEm(32);
    @include gridCards(fill);
    @include adaptiveValue("column-gap", 64, 7);

    @media (max-width: toEm(568)) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width:$mobileSmall){
       grid-template-columns: 1fr; 
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
