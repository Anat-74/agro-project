<script setup lang="ts">
interface Props {
  global: any;
  currentLocale: string;
  config: any;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 45,
  height: 45,
});
</script>

<template>
  <NuxtLink
    class="logo"
    :to="`/${props.currentLocale}`"
    aria-label="Go home"
  >
    <NuxtImg
      v-if="props.global?.footer?.logo?.length"
      :src="`${props.config.public.strapi.url}${props.global?.footer?.logo[0]?.url}`"
      class="logo-image"
      alt="logo"
      :width="props.width"
      :height="props.height"
      aria-label="На главную страницу"
    />
  </NuxtLink>
</template>

<style lang="scss" scoped>
.logo {
  border-radius: 50%;
  background-color: var(--warning-color);
  transition: background-color var(--transition-duration);

  @include hover {
   background-color: var(--warning-hover);
  }

   &-image {
      @include adaptiveValue("width", 45, 32);
   }
}
</style>
