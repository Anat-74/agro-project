<script setup lang="ts">
interface Props {
  global: any;
  currentLocale: string;
  config: any;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 62,
  height: 62,
});
</script>

<template>
  <NuxtLink
    class="logo-link"
    :to="`/${props.currentLocale}`"
    aria-label="Go home"
  >
    <NuxtImg
      v-if="props.global?.footer?.logo?.length"
      :src="`${props.config.public.strapi.url}${props.global?.footer?.logo[0]?.url}`"
      alt="logo"
      :width="props.width"
      :height="props.height"
      format="webp"
      aria-label="Go home"
    />
  </NuxtLink>
</template>

<style lang="scss" scoped>
.logo-link {
  border-radius: 50%;
  outline: 1px solid transparent;
  outline-offset: toRem(4);
  background-color: var(--light-color);
  transition: outline var(--transition-duration);

  @include hover {
    outline-color: var(--warning-color);
  }
}
</style>
