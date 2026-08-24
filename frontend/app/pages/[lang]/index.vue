<script setup lang="ts">
import FeaturedProductsSection from "~/components/home-sections/FeaturedProductsSection.vue";
import HeroSection from "~/components/home-sections/HeroSection.vue";
import SaleProductsSection from "~/components/home-sections/SaleProductsSection.vue";
import { seoTranslations } from '~/locales/seo'
const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();
const config = useRuntimeConfig();
const t = computed(() => seoTranslations[currentLocale.value])

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

// SEO (главная: статическая локализованная мета + ogUrl/ogImage)
useSeoMeta({
  title: t.value.homeTitle,
  ogTitle: t.value.homeTitle,
  description: t.value.homeDescription,
  ogDescription: t.value.homeDescription,
  ogUrl: `${config.public.siteUrl}${route.fullPath}`,
  ogImage: `${config.public.siteUrl}/pwa-512x512.png`,
});

console.debug("Home page data:", homePage.value);
</script>

<template>
  <div>
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
  </div>
</template>

<style lang="scss" scoped></style>

