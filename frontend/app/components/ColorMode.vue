<script setup lang="ts">
const colorMode = useColorMode();
const { brightness } = useThemeBrightness();
const showPercent = ref(false);
const showPopup = ref(false);
const popupRef = useTemplateRef<HTMLDivElement>("popup");
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const sliderValue = computed(() => brightness.value);

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

function iconName(theme: string) {
  if (theme === "light") return "ph:sun-duotone";
  if (theme === "dark") return "ph:moon-light";
  return "ph:coffee";
}

function themeLabel(theme: string) {
  if (theme === "light") return "Светлая";
  if (theme === "dark") return "Тёмная";
  return "Кастом";
}

function togglePopup() {
  showPopup.value = !showPopup.value;
}

function setTheme(theme: string) {
  colorMode.preference = theme;
  showPopup.value = false;
}
</script>

<template>
  <div class="color-mode">
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

      <div class="color-mode__ticks" aria-hidden="true">
        <span
          v-for="i in 4"
          :key="i"
          class="color-mode__tick"
          :style="{ left: `${i * 20}%` }"
        />
      </div>

      <button
        class="color-mode__thumb"
        @click.stop="togglePopup"
        :aria-label="`Тема: ${themeLabel(colorMode.preference)}. Нажмите для смены`"
      >
        <Icon :name="iconName(colorMode.preference)" />
      </button>

      <Transition name="popup">
        <div v-if="showPopup" class="color-mode__popup">
          <button
            v-for="theme in ['light', 'dark', 'custom']"
            :key="theme"
            :class="[
              'color-mode__option',
              {
                'color-mode__option_active': colorMode.preference === theme,
              },
            ]"
            @click="setTheme(theme)"
          >
            <Icon :name="iconName(theme)" />
            <span>{{ themeLabel(theme) }}</span>
          </button>
        </div>
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
    width: toRem(120);
    height: toRem(28);
  }

  &__slider {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;

    :deep(.u-input__range) {
      width: 100%;
      height: toRem(8);
      appearance: none;
      background: linear-gradient(
        90deg,
        var(--primary-color),
        var(--warning-color),
        var(--danger-color)
      );
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

  &__ticks {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  &__tick {
    position: absolute;
    top: 50%;
    translate: -50% -50%;
    width: toRem(2);
    height: toRem(10);
    border-radius: toRem(1);
    background-color: var(--light-color);
    opacity: 0.4;
  }

  &__thumb {
    position: absolute;
    left: calc(var(--slider-value, 50) * 1%);
    top: 50%;
    translate: -50% -50%;
    width: toRem(26);
    height: toRem(26);
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
      transform: translate(-50%, -50%) scale(1.1);
    }
  }

  &__popup {
    position: fixed;
    top: 0%;
    left: 50%;
    translate: -50% 0%;
    display: flex;
    flex-direction: column;
    gap: toRem(4);
    padding: toRem(8);
    border-radius: toRem(8);
    background: var(--secondary-color);
    box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.15);
    z-index: 10000;
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
    left: -22px;
    top: 50%;
    translate: 0 -50%;
    font-weight: 600;
    font-size: toEm(14);
    color: var(--light-color);
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
  transform: translate(-50%, toRem(-8));
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
