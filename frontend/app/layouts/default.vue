<script setup lang="ts">
const { find } = useStrapi();
const { currentLocale } = useLocale();

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
  <Header :global="global" />

  <main class="page-main">
    <SearchOverlay />
    <UBackground
      v-if="global?.background?.enableBackground"
      :background-options="global.background.options"
      variant="clean"
      size-mode="cover"
    />

    <slot />
  </main>

  <Footer
    class="footer"
    v-if="global"
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
