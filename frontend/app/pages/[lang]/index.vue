<script setup lang="ts">
import FeaturedProductsSection from "~/components/home-sections/FeaturedProductsSection.vue";
import HeroSection from "~/components/home-sections/HeroSection.vue";
import SaleProductsSection from "~/components/home-sections/SaleProductsSection.vue";
const { find } = useStrapi();
const { currentLocale } = useLocale();

const homePageKey = computed(() => `home-page-${currentLocale.value}`);

const {
  data: homePage,
  status,
  error,
} = useCachedAsyncData(
  homePageKey,
  async () => {
    const response = await find("home-page", {
      filters: { locale: { $eq: currentLocale.value } } as any,
    });

    if (!response || !response.data) {
      throw createError({ statusCode: 404, message: "Home page not found" });
    }

    return response.data as unknown as HomePage;
  },
   {
    watch: [() => currentLocale.value],
    ttl: 600_000,
  },
);

console.debug("Home page data:", homePage.value);
</script>

<template>
  <ULoader v-show="status === 'pending'" />

  <HeroSection
    v-if="homePage?.heroSlider || homePage?.heroGrids"
    :slides="homePage.heroSlider"
    :hero-grids="homePage.heroGrids"
  />

  <FeaturedProductsSection
    v-if="homePage?.featuredProducts"
    :featured-prod="homePage.featuredProducts"
  />

  <SaleProductsSection
    v-if="homePage?.featuredProducts"
    :sale-prod="homePage.featuredProducts"
  />

  <span v-if="error" class="error">
    {{ error.message }}
  </span>
</template>

<style lang="scss" scoped></style>

