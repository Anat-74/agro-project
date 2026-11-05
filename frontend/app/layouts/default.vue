<script setup lang="ts">
const { find } = useStrapi();
const { currentLocale } = useLocale();
const route = useRoute();

// Динамический фон (с переключателем) — на контентных типах страниц.
// Главная исключена: там секции (Hero/Featured/Sale) перекрывают глобальный фон
// своими статическими фонами.
const BG_PAGE_KEYS: BackgroundKey[] = ["catalog", "subcategory", "product", "products", "blog", "news", "cart", "cabinet", "auth", "about", "services", "contacts"];
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
</script>

<template>
  <AppHeader 
   v-if="global"
  :global="global" />

  <main class="page-main">
    <SearchOverlay />
    <!-- Обёртка с overflow:clip: transform-анимации фона (zoom/kenburns/press)
         масштабируют .app-bg и раньше увеличивали scrollable overflow страницы —
         появлялся «горизонтальный скролл» и «плыли» sticky-плашки. Клип режет
         визуальный overflow, layout не затрагивается. -->
    <div v-if="global?.background?.enableBackground && isBgPage" class="page-bg">
      <UBackground
        :background-options="global.background.options"
        variant="clean"
        size-mode="cover"
        defer
      />
    </div>

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
// ВАЖНО: без `min-height: 100dvh`! Каркас sticky-footer уже задан глобально в
// app.vue (#__nuxt: min-height:100dvh + flex-column; main: flex:1 1 auto).
// Дублирующий min-height перебивал flex:1 → main всегда был ≥ вьюпорта → подвал
// уезжал за экран, и на коротких страницах (напр. категория с 2 товарами)
// оставалась большая пустота. Здесь — только позиционирование: якорь для
// абсолютного фона (.app-bg) и собственный z-index-контекст.
.page-main {
  position: relative;
  z-index: 0;
}

// Слой фона страницы: клип, чтобы transform-анимации .app-bg не создавали
// прокручиваемый overflow (страница «скроллилась» по горизонтали и плашки ехали).
.page-bg {
  position: absolute;
  inset: 0;
  overflow: clip;
}
</style>
