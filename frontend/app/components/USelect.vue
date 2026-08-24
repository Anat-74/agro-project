<script setup lang="ts">
interface SelectOption {
  value: string | number
  label: string
  icon?: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number
  options?: SelectOption[]
  name?: string
  id?: string
  label?: string
  ariaLabel?: string
  disabled?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  options: () => [],
  name: "",
  id: "",
  label: "",
  ariaLabel: "",
  disabled: false,
  placeholder: "",
})

const emit = defineEmits<{
  "update:modelValue": [v: string | number]
}>()

const inputId = computed(() => props.id || `uselect-${useId()}`)
</script>

<template>
  <div class="select-wrapper">
    <label v-if="label" class="visually-hidden" :for="inputId">
      {{ label }}
    </label>
    <select
      :id="inputId"
      :name="name"
      :disabled="disabled"
      :aria-label="ariaLabel || undefined"
      class="select"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>
        {{ placeholder }}
      </option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.icon ? `${opt.icon} ${opt.label}` : opt.label }}
      </option>
    </select>
  </div>
</template>

<style lang="scss" scoped>
// Кастомная стрелка (fallback): appearance:none + стрелка из двух уголков.
// В браузерах без base-select (Firefox, iOS<27).
.select-wrapper {
  position: relative;

  &::before,
  &::after {
    content: "";
    pointer-events: none;
    position: absolute;
    top: calc(50% - toRem(1));
    width: toRem(6);
    height: toRem(2);
    background-color: var(--success-color);
  }
  &::before {
    right: toRem(9);
    transform: rotate(-125deg);
  }
  &::after {
    right: toRem(6);
    transform: rotate(125deg);
  }
}

.select {
  width: toEm(154);
  padding-inline: toEm(4);
  // Вертикальное центрирование: фикс. высота = line-height (flex на select не работает)
  height: toRem(30);
  line-height: toRem(26);
  padding-block: toRem(2) 0;
  border-radius: toEm(6);
  border: toRem(1) solid var(--border-color);
  appearance: none;
  cursor: pointer;
  background-color: var(--light-color);
  color: var(--primary-color);
  font-family: "Neucha", cursive, sans-serif;
  font-size: toRem(14);
  font-weight: 600;
  // Вдавливание (паттерн UInput в ColorMode, чуть сильнее)
  box-shadow:
    inset 0 toRem(2) toRem(3) rgba(0, 0, 0, 0.25),
    0 toRem(1) 0 rgba(255, 255, 255, 0.4);

  @media (max-width: $mobile) {
    width: toEm(112);
  }
}

// Унаследованный от select line-height (30px) не должен растягивать строки списка
option {
  line-height: normal;
}

// base-select (Chrome/Edge 135+, Safari 26.4+): специфика кнопки и пикера
@supports (appearance: base-select) {
  .select {
    appearance: base-select;

    // Стрелка раскрытия: жёлтая
    &::picker-icon {
      width: toRem(16);
      height: toRem(16);
      color: var(--success-color);
    }

    // Состояние «список открыт»
    &:open {
      border-color: var(--success-color);
    }
  }

  // Опции внутри пикера
  option {
    border-radius: toRem(6);
    padding-block: toRem(4);
    color: var(--color);
    background-color: var(--light-color);

    &:checked,
    &:hover {
      background-color: var(--bg-product);
      color: var(--color);
    }
  }

  // При base-select кастомная стрелка wrapper не нужна (её рисует ::picker-icon)
  .select-wrapper::before,
  .select-wrapper::after {
    display: none;
  }
}
</style>

<!-- Глобальные селекторы (top-layer пикер и interpolate-size) — не scoped -->
<style lang="scss">
@supports (appearance: base-select) {
  // Разрешает анимировать height (пикер)
  :root {
    interpolate-size: allow-keywords;
  }

  // Панель списка (top-layer): плавное открытие (transition + allow-discrete + starting-style)
  ::picker(select) {
    opacity: 0;
    height: 0;
    transition: all 0.5s;
    transition-behavior: allow-discrete;

    background: var(--light-color);
    border: toRem(2) solid var(--border-color);
    border-radius: toRem(8);
    color: var(--color);
    padding: toRem(8);
    overflow: clip;
  }

  :open::picker(select) {
    height: toRem(144);
    opacity: 1;

    @starting-style {
      opacity: 0;
      height: 0;
    }
  }
}
</style>
