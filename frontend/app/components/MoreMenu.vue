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

// <details> не закрывается сам по клику вне — добавляем закрытие по клику снаружи и по Escape.
// Контент — сосед details (приём grid-template-rows из ShowHamburger), поэтому проверяем обёртку
const menuRef = useTemplateRef<HTMLDivElement>('more-menu')

const closeOnOutsideClick = (e: MouseEvent) => {
  const root = menuRef.value
  if (!root) return
  const details = root.querySelector<HTMLDetailsElement>('details')
  if (details?.open && !root.contains(e.target as Node)) {
    details.open = false
  }
}

const closeOnEscape = (e: KeyboardEvent) => {
  const root = menuRef.value
  const details = root?.querySelector<HTMLDetailsElement>('details')
  if (e.key === 'Escape' && details?.open) details.open = false
}

onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick)
  document.addEventListener('keydown', closeOnEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', closeOnOutsideClick)
  document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <div ref="more-menu" class="more-menu visible-tablet">
    <details class="more-menu__details" name="header-more">
      <summary class="more-menu__summary">
        {{ t.summary }}
        <Icon name="ph:caret-down" />
      </summary>
    </details>
    <div class="more-menu__dropdown">
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
  position: relative;

  &__summary {
    display: flex;
    align-items: center;
    gap: toRem(4);
    cursor: pointer;
    list-style: none;
    padding: toRem(4) toRem(8);
    font-weight: 500;
    color: var(--dark-color);
    @include adaptiveValue("font-size", 21, 18);   // на 1px меньше

    &::-webkit-details-marker {
      display: none;
    }

    svg {
      transition: rotate var(--transition-duration);
    }
  }

  &__details[open] &__summary svg {
    rotate: -180deg;   // caret разворачивается при открытии
  }

  // Приём из ShowHamburger: контент — сосед details, анимация высоты через grid-template-rows
  &__dropdown {
    position: absolute;
    top: calc(100% + toRem(4));
    left: 0;
    z-index: 10;
    display: grid;
    grid-template-rows: 0fr;   // свёрнуто: строка 0
    opacity: 0;
    transition:
      grid-template-rows 0.3s,
      opacity 0.3s;
  }

  &__details[open] + &__dropdown {
    grid-template-rows: 1fr;   // раскрыто
    opacity: 1;
  }

  &__list {
    overflow: hidden;   // ключ: обрезает контент при 0fr
    min-height: 0;
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
