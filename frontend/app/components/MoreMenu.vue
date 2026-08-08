<script setup lang="ts">
import { moreMenuTranslations } from '~/locales/moreMenu'

const { currentLocale } = useLocale()
const t = computed(() => moreMenuTranslations[currentLocale.value])

interface Props {
  // Пункты меню из Strapi (global.header.navigation, dynamiczone layout.link)
  navigation?: NavLink[]
}

const props = defineProps<Props>()

// «Блог» рендерится отдельно в AppHeader (header__blog-link) — исключаем из меню «Ещё»
const filteredNavigation = computed(() =>
  (props.navigation ?? []).filter((item) => item.url !== '/blog')
)

// Иконки сопоставляем по url — в админке поля icon нет (label/url приходят из Strapi)
const iconByUrl: Record<string, string> = {
  '/about': 'mingcute:information-line',
  '/services': 'mingcute:settings-4-line',
  '/contacts': 'mingcute:mail-line',
  '/news': 'ph:megaphone-light'
}

// Helper возвращает строку (не string | undefined) — убирает подчёркивание у :name
const iconFor = (url: string): string => iconByUrl[url] ?? ''
</script>

<template>
  <details class="more-menu" name="header-more">
    <summary class="more-menu__summary">
      {{ t.summary }}
      <Icon name="mingcute:down-line" />
    </summary>
    <ul v-if="filteredNavigation.length" class="more-menu__list">
      <li v-for="item in filteredNavigation" :key="item.id" class="more-menu__item">
        <NuxtLink class="more-menu__link" :to="`/${currentLocale}${item.url}`">
          <Icon v-if="iconFor(item.url)" :name="iconFor(item.url)" /> {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </details>
</template>

<style lang="scss" scoped>
.more-menu {
  position: relative;

  &__summary {
    cursor: pointer;
    list-style: none;
    padding: toRem(4) toRem(8);
    font-weight: 500;
    color: var(--dark-color);

    &::-webkit-details-marker {
      display: none;
    }

    svg {
      transition: rotate var(--transition-duration);
    }
  }

  &[open] &__summary svg {
    rotate: -180deg;
  }

  &__list {
    position: absolute;
    top: calc(100% + toRem(4));
    left: 0;
    z-index: 10;
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

  &__item {
    &:last-child {
      .more-menu__link {
        svg {
          color: var(--danger-color);
        }
      }
    }
  }

  &__link {
    display: flex;
    order: 1;
    align-items: center;
    justify-content: space-between;
    padding: toRem(6) toRem(12);
    color: var(--color);
    text-decoration: none;
    border-radius: toRem(4);

    svg {
      order: 2;
      font-size: toEm(26);
      color: var(--green-color);
    }

    @include hover {
      background: var(--bg);
    }
  }
}
</style>
