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
      <LangSwitcher class="banner__lang-switcher" />
      <ClientOnly>
        <ColorMode class="banner__color-mode" />
      </ClientOnly>
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
    // Колонка: LangSwitcher сверху, colorMode снизу, по центру
    display: flex;
    flex-direction: column;
    align-items: center;      // горизонтальное центрирование (cross axis)
    justify-content: center;  // вертикальное (main axis)
    row-gap: toRem(4);
    // Светлый полупрозрачный фон (rgba, а не opacity — дочерние элементы
    // не теряют контраст)
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: toRem(8);
    padding: toRem(6) toRem(8);
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