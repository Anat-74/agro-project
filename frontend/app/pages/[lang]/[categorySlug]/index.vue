<script setup lang="ts">
import { buttonTranslations } from "~/locales/button";
import { productFilterTranslations } from "~/locales/productFilter";

const { find } = useStrapi();
const route = useRoute();
const { categorySlug } = route.params;
const { currentLocale } = useLocale();
const config = useRuntimeConfig();
const { width } = useViewport();
const { goBack, goForward } = useGoToForwardOrBack();

const page = ref(route.query.page ? +route.query.page : 1);
const pageSize = 12;

const { data, pending, error, refresh } = useAsyncData(
  `category-data-${currentLocale.value}-${categorySlug}-${page.value}`,
  async () => {
    // Параллельная загрузка категории, подкатегорий и продуктов
    const [categoryRes, subcategoriesRes, productsRes] = await Promise.all([
      find("categories", {
        filters: {
          slug: { $eq: categorySlug },
          locale: currentLocale.value,
        },
        fields: ["id", "name", "seoTitle", "seoDescription"],
        populate: {
          seoImage: {
            fields: ["id", "alternativeText", "url"],
          },
          seo: {
            fields: ["metaTitle", "metaDescription", "structuredData"],
          },
          subcategories: {
            fields: ["id"],
          },
          products: {
            fields: ["id"],
          },
        },
      }),
      find("subcategories", {
        filters: {
          category: { slug: { $eq: categorySlug } }, // Фильтруем по slug категории!
          locale: currentLocale.value,
        },
        populate: {
          image: {
            fields: ["alternativeText", "url"],
          },
        },
        pagination: {
          page: page.value,
          pageSize: pageSize,
        },
      }),
      find("products", {
        filters: {
          category: { slug: { $eq: categorySlug } }, // Фильтруем по slug категории!
          locale: currentLocale.value,
        },
        fields: ["id"],
        pagination: {
          page: page.value,
          pageSize: pageSize,
        },
      }),
    ]);

    // Обработка ошибок
    if (!categoryRes.data || categoryRes.data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Category Not Found",
      });
    }

    return {
      category: categoryRes.data[0] as Category,
      subcategories: subcategoriesRes as any, // Временное решение
      products: productsRes as any, // Временное решение
    };
  },
);

const visibleImagesCount = computed(() => {
  if (width.value < 565.98) return 2;
  if (width.value < 878.98) return 4;
  if (width.value < 1215.98) return 6;
  return 10;
});

// Разделяем данные
const category = computed(() => data.value?.category);
const subcategories = computed(() => data.value?.subcategories);
const products = computed(() => data.value?.products);

// Определяем, какие элементы отображать: подкатегории или продукты
const hasSubcategories = computed(() => {
  return subcategories.value?.data && subcategories.value.data.length > 0;
});

const hasProducts = computed(() => {
  return products.value?.data && products.value.data.length > 0;
});

const displayMode = computed(() => {
  if (hasSubcategories.value) {
    return "subcategories";
  } else if (hasProducts.value) {
    return "products";
  }
  return "empty";
});

//Управление загрузкой и ошибками
const isLoading = ref(pending);
const pageCount = computed(() => {
  if (displayMode.value === "subcategories") {
    return subcategories.value?.meta?.pagination?.pageCount || 1;
  } else {
    return products.value?.meta?.pagination?.pageCount || 1;
  }
});

//Обновление данных при изменении страницы
watch(
  () => route.query.page,
  (newPage) => {
    page.value = newPage ? +newPage : 1;
    refresh();
  },
);

//SEO оптимизация
watchEffect(() => {
  if (category.value) {
    useSeoMeta({
      title:
        category.value.seo?.metaTitle ||
        category.value.seoTitle ||
        category.value.name,
      description:
        category.value.seo?.metaDescription ||
        category.value.seoDescription ||
        category.value.name,
      ogTitle:
        category.value.seo?.metaTitle ||
        category.value.seoTitle ||
        category.value.name,
      ogDescription:
        category.value.seo?.metaDescription ||
        category.value.seoDescription ||
        category.value.name,
      ogImage: category.value.seoImage?.[0]?.url
        ? `${config.public.strapi.url}${category.value.seoImage[0].url}`
        : category.value.image?.[0]?.url
          ? `${config.public.strapi.url}${category.value.image[0].url}`
          : `${config.public.siteUrl}/default-category-image.jpg`,
      ogUrl: `${config.public.siteUrl}${route.fullPath}`,
    });

    // Добавляем structured data в useHead
    useHead({
      script: category.value?.seo?.structuredData
        ? [
            {
              type: "application/ld+json",
              innerHTML: JSON.stringify(category.value.seo.structuredData),
            },
          ]
        : [],
    });
  }
});
</script>

<template>
  <Loader v-show="isLoading" class="loader" />
  <section
    v-show="!isLoading"
    class="category-content"
    :aria-labelledby="
      displayMode === 'subcategories' ? 'subcategories' : 'products'
    "
  >
    <div class="category-content__buttons">
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
    </div>
    <h1
      class="category-content__category-title"
      :id="displayMode === 'subcategories' ? 'subcategories' : 'products'"
    >
      {{ category?.name }}
    </h1>

    <!-- Отображение подкатегорий, если они существуют -->
    <ul
      v-if="displayMode === 'subcategories' && subcategories?.data?.length"
      class="category-content__list"
    >
      <li
        v-for="(subcategory, index) in subcategories.data"
        :key="subcategory.id"
        class="category-content__item"
      >
        <NuxtLink
          class="category-content__link"
          :to="`/${currentLocale}/${categorySlug}/${subcategory.slug}`"
        >
          <h2 class="category-content__title">
            {{ subcategory.name }}
          </h2>
          <UImage
            class="category-content__image"
            v-if="
              subcategory.image &&
              subcategory.image.length > 0 &&
              subcategory.image[0]
            "
            :src="subcategory.image[0].url"
            :alt="subcategory.name"
            :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
            :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
            width="222"
            height="194"
            :smoothLoad="true"
          />
        </NuxtLink>
      </li>
    </ul>

    <!-- Отображение продуктов напрямую, если подкатегорий нет, но есть продукты -->
    <ul
      v-else-if="displayMode === 'products' && products?.data?.length"
      class="category-content__list"
    >
      <li
        v-for="(product, index) in products.data"
        :key="product.id"
        class="category-content__item"
      >
        <NuxtLink
          class="category-content__link"
          :to="`/${currentLocale}/${categorySlug}/products/${product.slug}`"
        >
          <h2 class="category-content__title">
            {{ product.name }}
          </h2>
          <UImage
            v-if="product.image && product.image.length > 0 && product.image[0]"
            :src="product.image[0]?.url"
            :alt="product.name"
            :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
            :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
            class="product-content__image"
            width="322"
            height="194"
            :smoothLoad="true"
          />
        </NuxtLink>
      </li>
    </ul>

    <!-- Сообщение, если нет ни подкатегорий, ни продуктов -->
    <div v-else-if="displayMode === 'empty'" class="category-content__empty">
      {{ productFilterTranslations[currentLocale].noResults }}
    </div>

    <Pagination
      v-if="displayMode !== 'empty'"
      class="category-content__pagination"
      :page="page"
      :pageCount="pageCount"
      :routeName="route.name?.toString() || ''"
    />
  </section>

  <div v-if="error" class="error">
    {{ error.message }}
  </div>
</template>

<style lang="scss" scoped>
.category-content {
  padding-block: toEm(12);

  &__buttons {
    display: inline-flex;
    align-items: center;
    column-gap: toRem(7);
    margin-block-end: toEm(12);
  }

  &__category-title {
    color: var(--dark-golden-color);
    @include adaptiveValue("margin-block-end", 6, 32);
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(toRem(222), 1fr));
    justify-items: center;
    row-gap: toEm(32);
    @include adaptiveValue("column-gap", 64, 7);
  }

  &__item {
    width: 100%;
    display: grid;
    justify-items: center;
    padding-inline: toEm(12);
    padding-block-end: toEm(7);
    background-color: var(--bg-product);
    box-shadow: 0px 1px 2px 0px var(--shadow);
    border-radius: toEm(4);
    @include containerParent;
  }

  &__link {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: toEm(4);
    transition: scale var(--transition-duration);

    @include hover {
      scale: 1.1;
      .category-content__title {
        color: var(--warning-hover);
      }
    }
  }

  &__title {
    flex: 1 auto;
    text-align: center;
    margin-block-end: toEm(7);
    transition: color var(--transition-duration);
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
