<script setup>
import { buttonTranslations } from '~/locales/button'

const props = defineProps({
  // Показывать только активный язык (одна кнопка); клик переключает на другой
  single: { type: Boolean, default: false },
  // Текстовая версия (RU/BE) вместо флагов — шрифт как у select (Neucha)
  codes: { type: Boolean, default: false },
})

const { currentLocale, locales, switchLocale } = useLocale()

// Безопасный доступ к переводам
const getButtonTranslation = (locale) => {
  return buttonTranslations[locale] || buttonTranslations.ru
}

const visibleLocales = computed(() =>
  props.single
    ? locales.filter((locale) => locale.code === currentLocale.value)
    : locales,
)

// Раскладка «одна активная кнопка»: клик по ней переключает на следующий язык
const onSelect = (code) => {
  if (!props.single) return switchLocale(code)

  const other = locales.find((locale) => locale.code !== currentLocale.value)
  if (other) switchLocale(other.code)
}
</script>

<template>
  <div
    class="lang-switcher"
    :class="{ 'lang-switcher_single': single, 'lang-switcher_codes': codes }"
  >
    <UButton
      v-for="locale in visibleLocales"
      :key="locale.code"
      variant="lang-switcher"
      :icon="codes ? '' : locale.icon"
      :class="{ active: currentLocale === locale.code }"
      :aria-label="getButtonTranslation(currentLocale).ariaLabelLang"
      @click="onSelect(locale.code)"
    >
      <template v-if="codes">{{ locale.code.toUpperCase() }}</template>
    </UButton>
  </div>
</template>

<style lang="scss" scoped>
.lang-switcher {
  height: auto;
  display: flex;
  column-gap: toRem(12);   // между кнопками флагов
  padding-inline: toRem(3);
  padding-block: toRem(2);
  border-radius: toRem(4);

  // Одна (активная) кнопка — она же переключатель на другой язык.
  // Бордер светлый, чтобы кнопка читалась на тёмных крошках.
  &_single .active {
    outline: 1px solid var(--light-color);
    outline-offset: 1px;
    cursor: pointer;
  }

  // Текстовая версия (RU/BE): как select-контрол — Neucha, 14px, 600
  &_codes .btn_lang-switcher {
    width: auto;
    height: auto;
    padding: toRem(1) toRem(6);
    border-radius: toRem(6);
    color: inherit;
    font-family: "Neucha", cursive, sans-serif;
    font-size: toRem(14);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: 0.02em;
  }
}
.active {
   outline: 1px solid var(--active-color);
   outline-offset: 1px;
   cursor: default;

   @include hover {
      scale: 1;
   }
}
</style>