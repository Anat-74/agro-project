<script setup lang="ts">
const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();

// Динамический фон (с переключателем) — на контентных типах страниц.
// Главная исключена: там секции (Hero/Featured/Sale) перекрывают глобальный фон
// своими статическими фонами.
const BG_PAGE_KEYS: BackgroundKey[] = ["catalog", "blog", "news", "cart", "cabinet", "auth", "static"];
const isBgPage = computed(() => BG_PAGE_KEYS.includes(getBackgroundKey(route.path)));

const {
  data: global,
  error,
  refresh,
} = useAsyncData(`global-${currentLocale.value}`, async () => {
  const response = await find("global", {
    filters: { locale: { $eq: currentLocale.value } } as any,
  });

  if (!response.data) {
    throw createError({ statusCode: 404, message: "Global not found" });
  }

  return response.data as unknown as GlobalData;
});

watch(currentLocale, () => {
  refresh();
});

console.debug("global data:", global.value);
</script>

<template>
  <AppHeader 
   v-if="global"
  :global="global" />

  <main class="page-main">
    <SearchOverlay />
    <UBackground
      v-if="global?.background?.enableBackground && isBgPage"
      :background-options="global.background.options"
      variant="clean"
      size-mode="cover"
    />

    <slot />
  </main>

  <AppFooter
    v-if="global"
    class="footer"
    :phones="global.phones"
    :email="global.email"
    :footer="global.footer"
    :legal="global.legal"
    :socials="global.socials"
    :global="global"
  />

  <span v-if="error"> Error: {{ error.message }} </span>
</template>

<style lang="scss" scoped>
.page-main {
  position: relative;
  z-index: 0;
  min-height: 100dvh;
}
</style>
