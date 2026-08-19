<script setup lang="ts">
import { colorModeTranslations } from "~/locales/colorMode"
import ColorModePopover from "~/components/popover/ColorModePopover.vue"

const colorMode = useColorMode();
const { currentLocale } = useLocale();
const t = computed(() => colorModeTranslations[currentLocale.value]);
const { brightness } = useThemeBrightness();
const showPercent = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Уникальный id попапа — на странице 2 экземпляра ColorMode (шапка + баннер)
const popupId = useId();

const sliderValue = computed(() => brightness.value);

// Класс темы: светлая/тёмная → ползунок под фон; кастом/system → анимированный градиент
const themeClass = computed(() => {
  if (colorMode.preference === "light") return "color-mode_light";
  if (colorMode.preference === "dark") return "color-mode_dark";
  return "color-mode_custom";
});

watch(brightness, () => {
  showPercent.value = true;
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    showPercent.value = false;
  }, 2000);
});

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer);
});

function themeLabel(theme: string) {
  if (theme === "light") return t.value.themeLight;
  if (theme === "dark") return t.value.themeDark;
  return t.value.themeCustom;   // «Анимация»
}

// Порядок тем: светлая → кастомная → тёмная, но активная всегда в конце.
// Если preference вне списка (напр. 'system') — просто три темы, без дубля.
const orderedThemes = computed(() => {
  const baseOrder = ["light", "custom", "dark"]
  const active = colorMode.preference
  if (!baseOrder.includes(active)) return baseOrder
  return [...baseOrder.filter((t) => t !== active), active]
})

// Опции для ColorModePopover (ключ + локализованная подпись)
const popupThemes = computed(() =>
  orderedThemes.value.map((theme) => ({ key: theme, label: themeLabel(theme) }))
)

function setTheme(theme: string) {
  colorMode.preference = theme;
}
</script>

<template>
  <div :class="['color-mode', themeClass]">
    <div
      class="color-mode__slider-wrapper"
      :style="{ '--slider-value': sliderValue }"
    >
      <UInput
        v-model="brightness"
        type="range"
        :min="0"
        :max="100"
        :step="1"
        :aria-label="t.ariaLabelBrightness"
        class="color-mode__slider"
      />

      <UButton
        variant="theme"
        class="color-mode__thumb"
        :popovertarget="popupId"
        :aria-label="`${t.ariaLabelTheme}: ${themeLabel(colorMode.preference)}. ${t.ariaLabelSwitch}`"
      >
        <!-- Статические имена → бандится в build (без runtime-фетча Iconify) -->
        <Icon v-if="colorMode.preference === 'light'" name="ph:sun-duotone" />
        <Icon v-else-if="colorMode.preference === 'dark'" name="ph:moon-light" />
        <Icon v-else name="material-symbols:auto-awesome" />
      </UButton>

      <Transition name="fade">
        <span v-if="showPercent" class="color-mode__percent"
          >{{ brightness }}%</span
        >
      </Transition>
    </div>

    <!-- Поповер выбора темы: top-center экрана, popover="auto" (нативный dismiss) -->
    <ColorModePopover
      :popup-id="popupId"
      :themes="popupThemes"
      :active="colorMode.preference"
      @select="setTheme"
    />
  </div>
</template>

<style lang="scss" scoped>
.color-mode {
  &__slider-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: toRem(72);       // на ~10% меньше (было 80)
    height: toRem(28);
  }

  &__slider {
    :deep(.u-input__range) {
      width: 100%;
      height: toRem(10);
      appearance: none;
      border-radius: toRem(4);
      outline: none;
      cursor: pointer;
      // Тонкий бордер для читаемости (слабое зрение) — var(--border-color) виден в обеих темах
      border: toRem(1) solid var(--border-color);
      box-shadow:
        inset 0 toRem(1) toRem(2) rgba(0, 0, 0, 0.2),
        0 toRem(1) 0 rgba(255, 255, 255, 0.3);

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: toRem(27);
        height: toRem(27);
        border-radius: 50%;
        background: var(--light-color);
        border: toRem(3) solid var(--warning-color);
        box-shadow: 0 0 toRem(8) rgba(0, 0, 0, 0.15);
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
      }

      &::-moz-range-thumb {
        width: toRem(27);
        height: toRem(27);
        border-radius: 50%;
        background: var(--light-color);
        border: toRem(3) solid var(--warning-color);
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
      }
    }
  }

  &__thumb {
    // Позиционирование на слайдере; внешний вид — в UButton (variant="theme")
    position: absolute;
    left: calc(var(--slider-value, 50) * 1%);
    top: 50%;
    translate: -50% -50%;
    z-index: 2;
  }

  &__percent {
    position: absolute;
    // По центру инпута (не за кнопкой), чуть выше
    left: 50%;
    bottom: calc(100% + toRem(2));
    translate: -50% 0;
    font-weight: 600;
    font-size: toEm(14);
    color: var(--border-color);   // цвет бордера соседних элементов container-top
  }

  // Ползунок под текущую тему:
  // светлая/тёмная — цвет фона темы (var(--bg) = фон блока ниже);
  // «Анимация» — переливающийся градиент.
  &.color-mode_light,
  &.color-mode_dark {
    .color-mode__slider :deep(.u-input__range) {
      background: var(--bg);
    }

    // Бордер кнопки-кружка — того же цвета, что и ползунок
    .color-mode__thumb {
      border-color: var(--bg);
    }
  }

  // Тёмная тема: фон кнопки совпадает с цветом ползунка (тёмный),
  // иконка-луна — светлая для контраста
  &.color-mode_dark {
    .color-mode__thumb {
      background: var(--bg);
      color: var(--light-color);
    }
  }

  &.color-mode_custom {
    .color-mode__slider :deep(.u-input__range) {
      background: linear-gradient(
        90deg,
        var(--primary-color),
        var(--warning-color),
        var(--danger-color),
        var(--primary-color)
      );
      background-size: 200% 100%;
      animation: slider-shimmer 4.5s linear infinite;   // ~в 1.5 раза медленнее
    }
  }
}

@keyframes slider-shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
