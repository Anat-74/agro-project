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
      <!-- На мобилке colorMode переезжает в шапку (container-top) — скрыт через banner__color-mode-wrap -->
      <div class="banner__color-mode-wrap">
        <ClientOnly>
          <ColorMode class="banner__color-mode" />
          <!-- Резервируем место под colorMode при SSR/гидратации (иначе langSwitcher
               виден один, потом colorMode «прыгает» и сдвигает вёрстку) -->
          <template #fallback>
            <div class="banner__color-mode-placeholder" aria-hidden="true"/>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.banner {
  overflow-x: auto;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  column-gap: toRem(4);
  padding-inline: toRem(4);
  background-color: var(--primary-color);
  // colorMode уехал в шапку на мобилке → баннер (текст + langSwitcher) вдвое ниже
  @include adaptiveValue("height", 60, 40);

  &__marquee {
    color: var(--light-color);
    @include adaptiveValue("font-size", 16, 14);
  }

  &__controls {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;      // горизонтальное центрирование (cross axis)
    justify-content: center;  // вертикальное (main axis)
    row-gap: toRem(6);
    // Светлый полупрозрачный фон (rgba, а не opacity — дочерние элементы
    // не теряют контраст)
    background-color: rgba(255, 255, 255, 0.15);
    // Бордер в стиле recessed-разделителя (тёмная линия + белый блик снизу)
    border: toRem(1) solid rgba(0, 0, 0, 0.25);
    box-shadow: 0 toRem(1) 0 rgba(255, 255, 255, 0.4);
    border-radius: toRem(6);
    padding: toRem(4);

    // Заглублённая (recessed) линия на весь блок, по центру между langSwitcher и colorMode
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translate(0, -50%);
      height: 1px;
      background: rgba(0, 0, 0, 0.25);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    // На мобилке остаётся один langSwitcher — разделитель не нужен
    @media (max-width: $tablet) {
      &::after {
        display: none;
      }
    }
  }

  &__color-mode-wrap {
    // На десктопе обёртка «растворяется» (flex-детки controls напрямую);
    // на мобилке colorMode в шапке — скрываем
    display: contents;

    @media (max-width: $tablet) {
      display: none;
    }
  }

  &__color-mode {
    opacity: 0;
    animation: fadeIn 0.3s ease-in-out 0.1s forwards;
  }

  // Заглушка под colorMode (размеры совпадают с ползунком 72×28)
  &__color-mode-placeholder {
    width: toRem(72);
    height: toRem(28);
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
</style>