<script setup lang="ts">
interface Props {
  global: any;
  currentLocale: string;
  width?: string | number;
  height?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 45,
  height: 45,
});
</script>

<template>
  <NuxtLink
    class="logo-link"
    :to="`/${props.currentLocale}`"
    aria-label="На главную"
  >
    <UImage
      class="logo-link__image"
      v-if="props.global?.footer?.logo?.length"
      :src="props.global?.footer?.logo[0]?.url"
      :width="props.width"
      :height="props.height"
      type="logo"
      alt="logo"
      aria-label="Логотип сайта"
    />
  </NuxtLink>
</template>

<style lang="scss" scoped>
.logo-link {
  border-radius: 50%;
  background-color: var(--warning-color);
  transition: background-color var(--transition-duration);

  @include hover {
   background-color: var(--warning-hover);
  }

   &__image {
      @include adaptiveValue("width", 45, 32);
   }
}
</style>
