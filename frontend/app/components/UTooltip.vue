<script setup lang="ts">
interface Props {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  tag?: 'button' | 'span' | 'div';
}

const { position = 'top', tag = 'span' } = defineProps<Props>()

const showTooltip = ref(false);
</script>

<template>
  <component 
    :is="tag"
    class="tooltip-trigger"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
    @focus="showTooltip = true"
    @blur="showTooltip = false"
  >
    <slot />
    <span 
      v-show="showTooltip"
      :class="['tooltip-content', `tooltip-${position}`]"
      role="tooltip"
    >
      {{ text }}
    </span>
  </component>
</template>

<style scoped lang="scss">
.tooltip-trigger {
  position: relative;
  display: inline-block;
  border: none;
  background: none;
  cursor: pointer;
  padding:toRem(9);
  margin: toRem(-9);
}

.tooltip-trigger_disabled {
  cursor: default;
  opacity: .6;
}

.tooltip-content {
  position: absolute;
  padding: toRem(4) toRem(8);
  border-radius: toRem(4);
  font-size: toRem(14);
  z-index: 1000;
  white-space: nowrap;
  color: var(--light-color);
  background-color: var(--warning-color);
}

/* Позиционирование */
.tooltip-top {
  bottom: 100%;
  left: 50%;
  translate: -50% -50%;
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  translate: -50% -50%;
}

.tooltip-left {
  right: 100%;
  top: 50%;
  translate: 0 -50%;
}

.tooltip-right {
  left: 100%;
  top: 50%;
  translate: 0 -50%;
}

/* Стрелка */
.tooltip-content::after {
  content: "";
  position: absolute;
  border: toRem(5) solid transparent;
}

.tooltip-top::after {
  top: 100%;
  left: 50%;
  translate: -50% 0;
  border-top-color: var(--warning-color);
}

.tooltip-bottom::after {
  bottom: 100%;
  left: 50%;
  translate: -50% 0;
  border-top-color: var(--warning-color);
}

.tooltip-left::after {
  left: 100%;
  top: 50%;
  translate: 0 -50%;
  border-top-color: var(--warning-color);
}

.tooltip-right::after {
  right: 100%;
  top: 50%;
  translate: 0 -50%;
  border-top-color: var(--warning-color);
}
</style>

