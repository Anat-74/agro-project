<script setup lang="ts">
import FeaturedProductsSection from "~/components/home-sections/FeaturedProductsSection.vue";
import HeroSection from "~/components/home-sections/HeroSection.vue";

const { find } = useStrapi();
const { currentLocale } = useLocale();
// const { width } = useViewport();

// const visibleImagesCount = computed(() => {
//   if (width.value < 565.98) return 2;
//   if (width.value < 878.98) return 4;
//   if (width.value < 1215.98) return 6;
//   return 10;
// });

// const { data: categories } = useAsyncData(
//   `category-${currentLocale.value}`,
//   async () => {
//     const response = await find<Category>("categories", {
//       filters: { locale: currentLocale.value },
//       populate: {
//         image: {
//           fields: ["alternativeText", "url"],
//         },
//         subcategories: {
//           fields: ["id"],
//         },
//         products: {
//           fields: ["id"],
//         },
//       },
//     });
//     if (!response.data || response.data.length === 0) {
//       throw createError({
//         statusCode: 404,
//         statusMessage: "Category - Not Found",
//       });
//     }
//     return response.data;
//   },
// );

// // Функция для определения типа ссылки для категории
// const getCategoryLink = (category: Category) => {
//   // Если у категории есть подкатегории, ведем к странице с подкатегориями
//   if (category.subcategories && category.subcategories.length > 0) {
//     return `/${currentLocale.value}/${category.slug}`;
//   }
//   // Если у категории есть продукты, ведем к странице с продуктами
//   else if (category.products && category.products.length > 0) {
//     return `/${currentLocale.value}/${category.slug}/products`;
//   }
//   // В противном случае ведем к странице категории (где будет отображено, что контента нет)
//   else {
//     return `/${currentLocale.value}/${category.slug}`;
//   }
// };

//==========================================================

const {
  data: homePage,
  pending,
  error,
  refresh,
} = useAsyncData(`home-page-${currentLocale.value}`, async () => {
  const response = await find("home-page", {
    filters: { locale: currentLocale.value },
  });

  if (!response) {
    throw createError({ statusCode: 404, message: "Home page not found" });
  }
  return response.data as unknown as HomePage;
});

console.debug("Home page data:", homePage.value);
</script>

<template>
  <Loader v-if="pending" />

  <HeroSection
    v-if="homePage?.heroSlider || homePage?.heroGrids"
    :slides="homePage.heroSlider"
    :hero-grids="homePage.heroGrids"
  />

  <FeaturedProductsSection
    v-if="homePage?.featuredProducts"
    :featured-prod="homePage.featuredProducts"
    :category-slug="categorySlug"
  />

  <!-- <section class="category" aria-labelledby="category-page">
    <div class="category__container">
      <h2 class="category__title" id="category-page">Топ категории</h2>
      <ul class="category__list" v-if="categories">
        <li
          class="category__item"
          v-for="(category, index) in categories"
          :key="category.id"
        >
          <NuxtLink
            class="category__link"
            :to="getCategoryLink(category)"
          >
            <UImage
              class="category__image"
              v-if="
                category.image && category.image.length > 0 && category.image[0]
              "
              :src="category.image[0].url"
              :alt="category.name"
              :smoothLoad="true"
              :loading="index < visibleImagesCount ? 'eager' : 'lazy'"
              :fetchpriority="index < visibleImagesCount ? 'high' : 'auto'"
              width="94"
              height="94"
            />

            <h3 class="category__card-title">{{ category.name }}</h3>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section> -->

  <span v-if="error" class="error">
    {{ error.message }}
  </span>
</template>

<style lang="scss" scoped>
</style>
