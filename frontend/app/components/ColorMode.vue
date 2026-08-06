<script setup lang="ts">
import { colorModeTranslations } from "~/locales/colorMode"

const colorMode = useColorMode();
const { currentLocale } = useLocale();
const t = computed(() => colorModeTranslations[currentLocale.value]);
const { brightness } = useThemeBrightness();
const showPercent = ref(false);
const showPopup = ref(false);
const popupRef = useTemplateRef<HTMLDivElement>("popup");
let hideTimer: ReturnType<typeof setTimeout> | null = null;

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

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer);
  document.removeEventListener("click", handleClickOutside);
});

function handleClickOutside(e: MouseEvent) {
  if (popupRef.value && !popupRef.value.contains(e.target as Node)) {
    showPopup.value = false;
  }
}

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

function togglePopup() {
  showPopup.value = !showPopup.value;
}

function setTheme(theme: string) {
  colorMode.preference = theme;
  showPopup.value = false;
}
</script>

<template>
  <div :class="['color-mode', themeClass]">
    <div
      class="color-mode__slider-wrapper"
      ref="popupRef"
      :style="{ '--slider-value': sliderValue }"
    >
      <UInput
        v-model="brightness"
        type="range"
        :min="0"
        :max="100"
        :step="1"
        class="color-mode__slider"
      />

      <button
        class="color-mode__thumb"
        @click.stop="togglePopup"
        :aria-label="`${t.ariaLabelTheme}: ${themeLabel(colorMode.preference)}. ${t.ariaLabelSwitch}`"
      >
        <!-- Статические имена → бандится в build (без runtime-фетча Iconify) -->
        <Icon v-if="colorMode.preference === 'light'" name="ph:sun-duotone" />
        <Icon v-else-if="colorMode.preference === 'dark'" name="ph:moon-light" />
        <Icon v-else name="material-symbols:auto-awesome" />
      </button>

      <Transition name="popup">
        <Teleport to="body">
          <div v-if="showPopup" class="color-mode__popup">
            <button
              v-for="theme in orderedThemes"
              :key="theme"
            :class="[
              'color-mode__option',
              `color-mode__option_${theme}`,
              {
                'color-mode__option_active': colorMode.preference === theme,
              },
            ]"
            @click="setTheme(theme)"
          >
            <Icon v-if="theme === 'light'" name="ph:sun-duotone" />
            <Icon v-else-if="theme === 'dark'" name="ph:moon-light" />
            <Icon v-else name="material-symbols:auto-awesome" />
            <span>{{ themeLabel(theme) }}</span>
          </button>
        </div>
        </Teleport>
      </Transition>

      <Transition name="fade">
        <span v-if="showPercent" class="color-mode__percent"
          >{{ brightness }}%</span
        >
      </Transition>
    </div>
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
      height: toRem(7);   // на 1px ниже (было 8)
      appearance: none;
      border-radius: toRem(4);
      outline: none;
      cursor: pointer;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: toRem(24);
        height: toRem(24);
        border-radius: 50%;
        background: var(--light-color);
        border: toRem(3) solid var(--warning-color);
        box-shadow: 0 0 toRem(8) rgba(0, 0, 0, 0.15);
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
      }

      &::-moz-range-thumb {
        width: toRem(24);
        height: toRem(24);
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
    position: absolute;
    left: calc(var(--slider-value, 50) * 1%);
    top: 50%;
    translate: -50% -50%;
    width: toRem(24);   // на 2px меньше (было 26)
    height: toRem(24);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--light-color);
    border: toRem(3) solid var(--warning-color);
    box-shadow: 0 0 toRem(8) rgba(0, 0, 0, 0.15);
    cursor: pointer;
    z-index: 2;
    color: var(--warning-color);
    font-size: toRem(14);
    transition: transform var(--transition-duration);

    @include hover {
      transform: scale(1.1) rotate(45deg);
    }
  }

  &__popup {
    // Правый верхний угол вьюпорта, поверх всего (fixed выходит из клиппинга
    // overflow баннера и корневого stacking context → z-index реально работает)
    position: fixed;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: toRem(4);
    padding: toRem(8);
    border-radius: toRem(8);
    background: var(--secondary-color);
    box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.15);
    z-index: 9999;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: toRem(8);
    padding: toRem(6) toRem(12);
    border: none;
    border-radius: toRem(4);
    cursor: pointer;
    background: transparent;
    color: var(--color);
    font-size: toEm(14);
    transition: background var(--transition-duration);

    // Заглублённая (recessed) линия между опциями (как у controls)
    &:not(:last-child) {
      border-block-end: 1px solid rgba(0, 0, 0, 0.25);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    // Цветные иконки по теме
    &_light {
      color: var(--warning-color);   // солнце
    }

    &_custom {
      color: #ff5e7e;   // яркий «анимированный» цвет

      svg {
        animation: custom-sway 3s ease-in-out infinite;
      }
    }

    &_dark {
      color: #5b6ee1;                // луна (индиго)
    }

    @include hover {
      background: var(--bg);
    }

    &_active {
      background: var(--success-color);
      color: var(--light-color);
    }
  }

  &__percent {
    position: absolute;
    left: -32px;   // на 10px левее
    top: 50%;
    translate: 0 -50%;
    font-weight: 600;
    font-size: toEm(14);
    color: var(--light-color);
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

@keyframes custom-sway {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg);
  }
}

.popup-enter-active,
.popup-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(toRem(-8));   // появление сверху / исчезание вверх
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
