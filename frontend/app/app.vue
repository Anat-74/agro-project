<script setup lang="ts">
import { seoTranslations } from "~/locales/appSeo";
import { VISIBILITY_KEY } from "#shared/utils/visibility";

const { currentLocale } = useLocale();
const colorMode = useColorMode();
const { brightness } = useThemeBrightness();
const route = useRoute();
const config = useRuntimeConfig();

const fullUrl = computed(() => {
  const baseUrl = config.public.siteUrl || "http://localhost:3000";
  return `${baseUrl}${route.path}`;
});

const seoData = computed(() => {
  return seoTranslations[currentLocale.value] || seoTranslations.ru;
});

const containerVars = computed(() => ({
  '--theme': colorMode.preference,
  '--brightness': brightness.value,
  '--locale': currentLocale.value,
}));

useHead({
  link: [
    { rel: "preconnect", href: config.public.strapi.url },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon-180x180.png" },
  ],
});

watch([currentLocale, () => route.path], () => {
  const locales: LocaleCode[] = ["ru", "be"];

  const pathWithoutCurrentLocale = route.path.replace(
    /^\/(ru|be)(\/|$)/,
    "/",
  );
  const hreflangLinks = locales.map((locale) => {
    const newUrl = `/${locale}${pathWithoutCurrentLocale}`;
    return {
      rel: "alternate",
      hreflang: locale,
      href: `${config.public.siteUrl}${newUrl}`,
    };
  });

  useHead({
    title: seoData.value.title,
    htmlAttrs: { lang: currentLocale.value },
    link: [
      { rel: "canonical", href: fullUrl.value },
      ...hreflangLinks,
    ],
    meta: [
      { name: "description", content: seoData.value.description },
      { property: "og:title", content: seoData.value.ogTitle },
      { property: "og:description", content: seoData.value.ogDescription },
      { property: "og:url", content: fullUrl.value },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Organick" },
      { property: "og:image", content: `${config.public.siteUrl}/logo.png` },
      { property: "og:locale", content: currentLocale.value },
      {
        property: "og:locale:alternate",
        content: locales.filter((l) => l !== currentLocale.value)[0] || "be",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: seoData.value.ogTitle },
      { name: "twitter:description", content: seoData.value.ogDescription },
      { name: "twitter:image", content: `${config.public.siteUrl}/logo.png` },
      { property: "vk:image", content: `${config.public.siteUrl}/logo.png` },
      { property: "vk:title", content: seoData.value.ogTitle },
      {
        property: "telegram:image",
        content: `${config.public.siteUrl}/logo.png`,
      },
      { property: "al:ios:app_name", content: "Organick" },
      { property: "al:android:app_name", content: "Organick" },
    ],
  });
}, { immediate: true });

const isContacts = ref<boolean>(false);

const visibleIsContacts = () => (isContacts.value = true);
const hideContacts = () => (isContacts.value = false);

provide(VISIBILITY_KEY, {
  isContacts,
  visibleIsContacts,
  hideContacts,
});

</script>

<template>
  <VitePwaManifest />
  <PWAUpdateNotice />
  <div :style="containerVars">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style lang="scss">
#__nuxt {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;

  main {
    flex: 1 1 auto;
  }
}
</style>