<script setup lang="ts">
const colorMode = useColorMode()
const { brightness } = useThemeBrightness()

const showPercent = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

watch(brightness, () => {
  showPercent.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { showPercent.value = false }, 2000)
})

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
})

function iconName(theme: string) {
  if (theme === 'light') return 'ph:sun-duotone'
  if (theme === 'dark') return 'ph:moon-light'
  return 'ph:coffee'
}
</script>

<template>
  <div class="color-mode">
    <ul class="color-mode__themes">
      <li v-for="theme of ['light', 'dark', 'custom']" :key="theme" class="color-mode__item">
        <UButton
          variant="color-theme"
          :icon="iconName(theme)"
          :theme="theme"
          :aria-label="theme"
          @click="colorMode.preference = theme"
        />
      </li>
    </ul>
    <div class="color-mode__brightness">
      <UInput
        v-model="brightness"
        type="range"
        :min="0"
        :max="100"
        :step="1"
      />
      <Transition name="fade">
        <span v-if="showPercent" class="color-mode__percent">{{ brightness }}%</span>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.color-mode {
  display: flex;
  flex-direction: column;
  row-gap: toRem(8);

  &__themes {
    display: inline-flex;
    column-gap: toRem(4);

    @media (max-width: $mobile) {
      flex-direction: column;
      row-gap: toRem(6);
    }

    @container style(--theme: custom) {
      animation: fadeInScale 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
  }

  &__brightness {
    position: relative;
    padding-inline: toRem(2);

    @container style(--theme: custom) {
      animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
      opacity: 0;
    }

    // В custom-теме — нестандартный ползунок
    @container style(--theme: custom) {
      :deep(.u-input__range) {
        background: linear-gradient(
          90deg,
          var(--primary-color),
          var(--warning-color),
          var(--danger-color)
        );
        height: toRem(8);
        border-radius: toRem(4);
        animation: brightnessTrackPulse 2s ease-in-out infinite;

        &::-webkit-slider-thumb {
          width: toRem(22);
          height: toRem(22);
          background: var(--light-color);
          border: toRem(3) solid var(--warning-color);
          box-shadow: 0 0 toRem(12) var(--warning-color),
         0 toRem(2) toRem(8) rgba(0, 0, 0, 0.2);
          animation: brightnessThumbGlow 2s ease-in-out infinite;
        }

        &::-moz-range-thumb {
          width: toRem(22);
          height: toRem(22);
          background: var(--light-color);
          border: toRem(3) solid var(--warning-color);
          box-shadow: 0 0 toRem(12) var(--warning-color),
                      0 toRem(2) toRem(8) rgba(0, 0, 0, 0.2);
        }
      }
    }
  }

  &__percent {
    position: absolute;
    right: toRem(-36);
    top: 50%;
    translate: 0 -50%;
    font-weight: 600;
    font-size: toEm(18);
    color: var(--light-color);
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