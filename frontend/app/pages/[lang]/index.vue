<script setup lang="ts">
import FeaturedProductsSection from "~/components/home-sections/FeaturedProductsSection.vue";
import HeroSection from "~/components/home-sections/HeroSection.vue";
import SaleProductsSection from "~/components/home-sections/SaleProductsSection.vue";

const { find } = useStrapi();
const { currentLocale } = useLocale();

// ========== 1. ХЕЛПЕРЫ ДЛЯ КЭША ==========
const saveToCache = (key: string, data: any) => {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch (e) {
    console.warn("Cache save failed:", e);
  }
};

const loadFromCache = (key: string) => {
  if (!import.meta.client) return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    // Данные живут 7 дней
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return { ...data, _offline: true };
  } catch {
    return null;
  }
};

// ========== 2. ОНЛАЙН/ОФФЛАЙН СТАТУС ==========
const isOnline = ref(true);

if (import.meta.client) {
  isOnline.value = navigator.onLine;

  const handleOnline = () => {
    isOnline.value = true;
  };
  const handleOffline = () => {
    isOnline.value = false;
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  onUnmounted(() => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  });
}

// ========== 3. ОСНОВНАЯ ЛОГИКА ==========
const homePageKey = computed(() => `home-page-${currentLocale.value}`);

const {
  data: homePage,
  pending,
  error,
} = useAsyncData(
  homePageKey,
  async () => {
    try {
      const response = await find("home-page", {
        filters: { locale: currentLocale.value },
      });

      if (!response || !response.data) {
        throw createError({ statusCode: 404, message: "Home page not found" });
      }

      // Сохраняем в кэш для оффлайн
      if (import.meta.client) {
        saveToCache(homePageKey.value, response.data);
      }

      return response.data;
    } catch (e) {
      // Если нет интернета - берем из кэша
      if (!isOnline.value) {
        const cached = loadFromCache(homePageKey.value);
        if (cached) return cached;
      }
      throw e;
    }
  },
  {
    // Трансформация данных
    transform: (data) => ({
      ...data,
      _offline: data._offline || false,
    }),

    // Авто-обновление при смене локали
    watch: [() => currentLocale.value],

    // Кэширование (память → localStorage)
    getCachedData: (key, nuxtApp) => {
      if (import.meta.client) {
        if (nuxtApp.payload.data[key]) {
          return nuxtApp.payload.data[key];
        }
        return loadFromCache(key);
      }
    },
  },
);

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
  />

  <SaleProductsSection
    v-if="homePage?.featuredProducts"
    :sale-prod="homePage.featuredProducts"
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

<style lang="scss" scoped></style>
