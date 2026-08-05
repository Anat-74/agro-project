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
    <div class="banner__controls">
      <ClientOnly>
        <ColorMode class="banner__color-mode" />
      </ClientOnly>
      <LangSwitcher class="banner__lang-switcher" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.banner {
  overflow-x: auto;
  display: grid;
  grid-template-columns: 1fr auto;   // текст слева, блок управления справа
  align-items: center;
  column-gap: toRem(12);
  padding-inline: toRem(4);
  background-color: var(--primary-color);
  @include adaptiveValue("height", 60, 72);

  &__marquee {
    color: var(--light-color);
    @include adaptiveValue("font-size", 16, 14);
  }

  &__controls {
    // Мобильный: колонка (colorMode выше LangSwitcher)
    .banner__lang-switcher {
      margin-block-start: toRem(4);
    }

    @media (min-width: $mobile) {
      // ПК: всё в ряд
      display: flex;
      align-items: center;
      gap: toRem(12);

      .banner__lang-switcher {
        margin-block-start: 0;
      }
    }
  }

  &__color-mode {
    opacity: 0;
    animation: fadeIn 0.3s ease-in-out 0.1s forwards;
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
</style>