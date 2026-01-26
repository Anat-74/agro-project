<script setup lang="ts">
interface Props {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number; // Задержка в миллисекундах
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  delay: 0
});

const showTooltip = ref(false);
let hideTimeout: number | null = null;

const show = () => {
  if (hideTimeout) clearTimeout(hideTimeout);
  showTooltip.value = true;
};

const hide = () => {
  hideTimeout = window.setTimeout(() => {
    showTooltip.value = false;
  }, props.delay);
};
</script>

<template>
  <div 
  class="tooltip-trigger" 
  @mouseenter="show" 
  @mouseleave="hide" 
  @focus="show" 
  @blur="hide"
  >
    <slot />
    <span 
      v-show="showTooltip"
      :class="['tooltip-content', `tooltip-${position}`]"
      role="tooltip"
    >
      {{ text }}
    </span>
  </div>
</template>

<style scoped>
.tooltip-trigger {
  position: relative;
  display: inline-block;
}

.tooltip-content {
  position: absolute;
  background-color: #333;
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity .2s ease, visibility .2s ease;
}

.tooltip-content[role="tooltip"]:not([hidden]) {
  opacity: 1;
  visibility: visible;
}

/* Позиционирование */
.tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 6px;
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 6px;
}

.tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 6px;
}

.tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 6px;
}

/* Стрелка */
.tooltip-content::after {
  content: "";
  position: absolute;
  border: 5px solid transparent;
}

.tooltip-top::after {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: #333;
}

.tooltip-bottom::after {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: #333;
}

.tooltip-left::after {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-left-color: #333;
}

.tooltip-right::after {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-right-color: #333;
}
</style>
