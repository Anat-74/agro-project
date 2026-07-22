<script setup lang="ts">
interface Props {
  bannerText?: string
}

withDefaults(defineProps<Props>(), {
  bannerText: "Store Location: Kolasa - 34, Minsk, Belarus",
})
</script>

<template>
  <div class="banner">
    <UMarqueeText class="banner__marquee" :text="bannerText" />
    <ClientOnly>
      <ColorMode class="banner__color-mode" />
    </ClientOnly>
    <LangSwitcher class="banner__lang-switcher hidden-mobile" />
  </div>
</template>

<style lang="scss" scoped>
.banner {
  overflow-x: auto;
  display: grid;
  align-items: center;
  padding-inline: toRem(4);
  background-color: var(--primary-color);
  @include adaptiveValue("height", 60, 72);

  @media (min-width: $mobile) {
    grid-template-columns: 1fr repeat(2, auto);
    column-gap: toRem(12);
    padding-inline: toRem(4);
  }

  &__marquee {
    color: var(--light-color);
    @include adaptiveValue("font-size", 16, 14);
  }

  &__color-mode {
    opacity: 0;
    animation: fadeIn 0.3s ease-in-out 0.1s forwards;

    @media (max-width: $mobile) {
      justify-self: end;
    }
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
</style>