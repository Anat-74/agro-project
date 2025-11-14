<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'danger'
  size?: 'medium' | 'large'
  isLoading?: boolean
  isDisabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'large',
  isLoading: false,
  isDisabled: false,
  type: 'button'
})

defineEmits<Emits>()
</script>

<template>
  <button
    :class="['app-button', variant, size, { loading: isLoading }]"
    :disabled="isDisabled || isLoading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <span 
    v-if="isLoading" 
    class="button-spinner"
    ></span>
    <span class="button-content">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all .2s ease;
  background-color: var(--primary-color);
}

.app-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.app-button:focus-visible {
 outline: 4px solid var(--warning-color);
}


@media (max-width:768px){
   .app-button {
      font-size: 16px;
     }
}

/* Варианты */
.app-button.primary {
  background-color: var(--primary-color);
  color: white;
}

.app-button.primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.app-button.danger {
  background-color: var(--danger-color);
  color: var(--light-color);
}

.app-button.danger:hover:not(:disabled) {
  background-color: var(--danger-hover);
}

/* Размеры */
.app-button.medium {
  padding: 6px 12px;
  font-size: 14px;
}

.app-button.large {
  padding: 8px 16px;
  font-size: 16px;
}

@media (max-width:768px){
   .app-button.large:hover:not(:disabled) {
  background-color: var(--primary-hover);
} 
}

/* Состояние загрузки */
.app-button.loading {
  pointer-events: none;
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>