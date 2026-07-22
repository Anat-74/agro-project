<script setup lang="ts">
interface Props {
  text: string
  speed?: number
}

withDefaults(defineProps<Props>(), {
  speed: 9,
})
</script>

<template>
  <div class="u-marquee" :style="{ '--speed': `${speed}s` }">
    <span class="u-marquee__content">{{ text }}</span>
    <span class="u-marquee__content" aria-hidden="true">{{ text }}</span>
  </div>
</template>

<style lang="scss" scoped>
.u-marquee {
  overflow: hidden;
  white-space: nowrap;
  display: flex;

  &__content {
    flex-shrink: 0;
    animation: u-marquee-scroll var(--speed, 9s) infinite linear;
  }
}

@keyframes u-marquee-scroll {
  0% {
    translate: 0;
  }
  100% {
    translate: -100%;
  }
}
</style>
