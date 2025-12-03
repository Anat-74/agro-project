<script setup lang="ts">
interface Props {
  global: any;
  currentLocale: string;
  config: any;
}

const props = defineProps<Props>();
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
      width="76"
      height="67"
      format="webp"
    />
  </NuxtLink>
</template>

<style lang="scss" scoped>
.logo-link {
  justify-self: start;
  margin-inline-start: toRem(20);
  border-radius: 50%;
  padding-inline: toEm(6);
  padding-block: toEm(8);
  outline: 1px solid var(--light-color);
  outline-offset: toRem(2);
  background-color: var(--light-color);
  transition: outline var(--transition-duration);

  @include hover {
    outline-color: var(--warning-hover);
  }

  @media (max-width: $mobile) {
    width: toRem(68);
    margin-inline-start: toRem(0);
  }

  @media (max-width: $mobileSmall) {
    width: toEm(55);
    border-radius: 50%;
    position: absolute;
    top: toEm(10);
  }
}
</style>
