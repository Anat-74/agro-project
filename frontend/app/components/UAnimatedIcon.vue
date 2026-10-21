<script setup lang="ts">
/**
 * Анимированная иконка.
 *
 * Варианты анимации:
 *  - wind  — лёгкое покачивание «на ветру» (от основания) с плавным
 *            увеличением/уменьшением размера;
 *  - pulse — мягкое «дыхание» (масштаб 1 → 1.04);
 *  - none  — без анимации.
 *
 * Уважает prefers-reduced-motion: анимации глобально отключаются правилом
 * в _normalize.scss (@media (prefers-reduced-motion: reduce) { * { ... } }),
 * поэтому собственного медиа-дубля здесь нет.
 *
 * Размер задаётся снаружи на самом svg (как у обычного Icon).
 */
interface Props {
  name: string
  animation?: "wind" | "pulse" | "none"
  // Длительность одного цикла, сек
  duration?: number
  // Задержка старта, сек
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  animation: "wind",
  duration: 6,
  delay: 0,
})

const animationStyle = computed(() => ({
  animationDuration: `${props.duration}s`,
  animationDelay: `${props.delay}s`,
}))
</script>

<template>
  <Icon
    :name="name"
    :class="['u-animated-icon', `u-animated-icon_${animation}`]"
    :style="animationStyle"
  />
</template>

<style lang="scss" scoped>
.u-animated-icon {
  display: inline-block;
  transform-origin: 50% 92%;

  &_wind {
    animation-name: u-animated-icon-wind;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }

  &_pulse {
    transform-origin: 50% 50%;
    animation-name: u-animated-icon-pulse;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }


  &_none {
    animation: none;
  }
}

@keyframes u-animated-icon-wind {
  0%,
  100% {
    rotate: -2deg;
    translate: 0 0;
    scale: 1;
  }

  30% {
    rotate: 3deg;
    translate: 0 -1px;
    scale: 1.06;
  }

  55% {
    rotate: -1.5deg;
    translate: 0 0;
    scale: 0.98;
  }

  80% {
    rotate: 2deg;
    translate: 0 -0.5px;
    scale: 1.03;
  }
}

@keyframes u-animated-icon-pulse {
  0%,
  100% {
    scale: 1;
  }

  50% {
    scale: 1.04;
  }
}

</style>
