<script setup lang="ts">
import { moreMenuTranslations } from '~/locales/moreMenu'

const { currentLocale } = useLocale()
const t = computed(() => moreMenuTranslations[currentLocale.value])

interface Props {
  // Пункты меню из Strapi (global.header.navigation, dynamiczone layout.link)
  navigation?: NavLink[]
}

const props = defineProps<Props>()

// «Главная» (/ — на неё ведёт логотип) исключена из меню «Ещё»
const filteredNavigation = computed(() =>
  (props.navigation ?? []).filter((item) => item.url !== '/')
)

// Иконки сопоставляем по url — в админке поля icon нет (label/url приходят из Strapi)
const iconByUrl: Record<string, string> = {
  '/about': 'mingcute:information-line',
  '/services': 'mingcute:settings-4-line',
  '/contacts': 'mingcute:mail-line',
  '/news': 'ph:megaphone-light',
  '/blog': 'ph:newspaper'
}

// Helper возвращает строку (не string | undefined) — убирает подчёркивание у :name
const iconFor = (url: string): string => iconByUrl[url] ?? ''
</script>

<template>
  <div class="more-menu visible-tablet">
    <button
      type="button"
      class="more-menu__summary"
      popovertarget="header-more-menu"
    >
      {{ t.summary }}
      <Icon name="ph:caret-down" />
    </button>
    <!-- Popover API: открытие/закрытие кликом, Escape и кликом вне — нативно, без JS.
         Позиционирование — Anchor Positioning относительно кнопки (--more-menu). -->
    <div id="header-more-menu" popover class="more-menu__dropdown">
      <ul v-if="filteredNavigation.length" class="more-menu__list">
        <li v-for="item in filteredNavigation" :key="item.id" class="more-menu__item">
          <NuxtLink class="more-menu__link" :to="`/${currentLocale}${item.url}`">
            <Icon v-if="iconFor(item.url)" :name="iconFor(item.url)" /> {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.more-menu {
  // Caret разворачивается, когда поповер открыт (top-layer, но остаётся DOM-потомком)
  &:has(.more-menu__dropdown:popover-open) &__summary svg {
    rotate: -180deg;
  }

  &__summary {
    display: flex;
    align-items: center;
    gap: toRem(4);
    cursor: pointer;
    padding: toRem(4) toRem(8);
    font-weight: 500;
    color: var(--dark-color);
    anchor-name: --more-menu;   // якорь для дропдауна (Anchor Positioning)
    @include adaptiveValue("font-size", 21, 18);   // на 1px меньше

    svg {
      transition: rotate var(--transition-duration);
    }
  }

  // Дропдаун в top-layer: не нужны z-index и overflow-борьба с родителями.
  // Позиция — bottom span-right (правый край кнопки); фолбэк --fb-left,
  // если кнопка у левого края экрана и блок не влезает
  &__dropdown {
    position: fixed;
    margin: 0;
    inset: auto;
    margin-block-start: toRem(4);
    position-anchor: --more-menu;
    position-area: bottom span-right;
    position-try-fallbacks: flip-block, --fb-left;

    opacity: 0;
    translate: 0 -toRem(4);
    transition:
      opacity var(--transition-duration),
      translate var(--transition-duration),
      overlay var(--transition-duration) allow-discrete,
      display var(--transition-duration) allow-discrete;

    &:popover-open {
      opacity: 1;
      translate: 0 0;
    }

    @starting-style {
      &:popover-open {
        opacity: 0;
        translate: 0 -toRem(4);
      }
    }
  }

  &__list {
    overflow: hidden;
    min-width: toRem(160);
    background: var(--secondary-color);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(4);
    padding: toRem(4);
    display: flex;
    flex-direction: column;
    gap: toRem(2);
    white-space: nowrap;
    box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.1);
  }

  &__link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: toRem(6) toRem(12);
    color: var(--color);
    text-decoration: none;
    border-radius: toRem(4);

    svg {
      font-size: toEm(26);
      color: var(--green-color);
    }

    @include hover {
      background: var(--bg);
    }
  }
}

// Кастомный фолбэк: левое выравнивание (когда span-right не влезает у края экрана)
@position-try --fb-left {
  position-area: bottom left;
}
</style>
