<script setup lang="ts">
type InputType = 'text' | 'textarea' | 'search' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'checkbox' | 'range'

interface Props {
  type?: InputType
  label?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  icon?: string
  autocomplete?: string
  min?: number
  max?: number
  step?: number
  ariaLabel?: string
}

const { type = 'text', label = '', placeholder = '', rows = 3,
  disabled = false, readonly = false, required = false, error = '', icon = '',
  autocomplete = '', min = 0, max = 100, step = 1, ariaLabel = '' } = defineProps<Props>()

const model = defineModel<any>()
const inputId = useId()
const showPassword = ref(false)
const { currentLocale } = useLocale()
const passwordLabels = { ru: { show: 'Показать пароль', hide: 'Скрыть пароль' }, be: { show: 'Паказаць пароль', hide: 'Схаваць пароль' } }
const passwordLabel = computed(() => showPassword.value
  ? passwordLabels[currentLocale.value]?.hide || passwordLabels.ru.hide
  : passwordLabels[currentLocale.value]?.show || passwordLabels.ru.show)
const inputType = computed(() => {
  if (type === 'password' && showPassword.value) return 'text'
  return type
})
</script>

<template>
  <div class="u-input" :class="{ 'u-input_error': error }">
    <label v-if="label && type !== 'checkbox'" :for="inputId" class="u-input__label">
      {{ label }}
      <span v-if="required" class="u-input__required">*</span>
    </label>

    <textarea
      v-if="type === 'textarea'"
      :id="inputId"
      v-model="model"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autocomplete="autocomplete || undefined"
      :aria-label="ariaLabel || undefined"
      class="u-input__field u-input__field_textarea"
    />

    <div v-else-if="type === 'checkbox'" class="u-input__checkbox-wrapper">
      <input
        :id="inputId"
        type="checkbox"
        :checked="!!model"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete || undefined"
        :aria-label="ariaLabel || undefined"
        class="u-input__checkbox"
        @change="($e) => model = ($e.target as HTMLInputElement).checked"
      >
      <label v-if="label" :for="inputId" class="u-input__checkbox-label">
        {{ label }}
        <span v-if="required" class="u-input__required">*</span>
      </label>
    </div>

    <div v-else-if="type === 'range'" class="u-input__range-wrapper">
      <input
        :id="inputId"
        v-model="model"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-label="ariaLabel || undefined"
        class="u-input__range"
      >
    </div>

    <div v-else class="u-input__wrapper">
      <Icon v-if="icon" :name="icon" class="u-input__icon" />
      <input
        :id="inputId"
        v-model="model"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete || undefined"
        :aria-label="ariaLabel || undefined"
        class="u-input__field"
        :class="{ 'u-input__field_password': type === 'password' }"
      >
      <UButton
        v-if="type === 'password'"
        variant="icon"
        class="u-input__toggle-password"
        :aria-label="passwordLabel"
        @click="showPassword = !showPassword"
      >
        <Icon :name="showPassword ? 'mdi:eye-off' : 'mdi:eye'" width="20" height="20" />
      </UButton>
    </div>

    <span v-if="error" class="u-input__error">{{ error }}</span>
  </div>
</template>

<style lang="scss" scoped>
.u-input {
  display: flex;
  flex-direction: column;
  row-gap: toEm(4);

  &_error {
    .u-input__field {
      border-color: var(--danger-color);
    }
  }

  &__label {
    font-weight: 500;
    color: var(--color);
    @include adaptiveValue("font-size", 14, 12);
  }

  &__required { color: var(--danger-color); }

  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__icon {
    position: absolute;
    left: toRem(12);
    font-size: toRem(18);
    color: var(--gray-color);
    pointer-events: none;
  }

  &__field {
    width: 100%;
    padding-inline: toRem(12);
    padding-block: toRem(10);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(4);
    color: var(--color);
    background-color: var(--bg);
    transition: border-color var(--transition-duration);
    @include adaptiveValue("font-size", 14, 13);

    &:focus-visible {
      outline: toRem(2) solid var(--warning-color);
      outline-offset: toRem(2);
    }

    &:disabled {
      background-color: var(--bg);
      opacity: 0.6;
      cursor: not-allowed;
    }

    &_textarea {
      resize: vertical;
      min-height: toRem(80);
    }
  }

  &__checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: toEm(8);
  }

  &__checkbox {
    appearance: none;
    width: toRem(18);
    height: toRem(18);
    border: toRem(2) solid var(--border-color);
    border-radius: toRem(3);
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--transition-duration);
    position: relative;

    &:checked {
      background-color: var(--success-color);
      border-color: var(--success-color);

      &::after {
        content: '';
        position: absolute;
        top: 45%;
        left: 50%;
        width: toRem(5);
        height: toRem(9);
        border: solid var(--light-color);
        border-width: 0 toRem(2) toRem(2) 0;
        transform: translate(-50%, -50%) rotate(45deg);
      }
    }

    &:focus-visible {
      outline: toRem(2) solid var(--warning-color);
      outline-offset: toRem(2);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__checkbox-label {
    cursor: pointer;
    font-size: toRem(14);
    color: var(--color);
    user-select: none;
  }

  &__range {

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: toRem(18);
      height: toRem(18);
      border-radius: 50%;
      background: var(--primary-color);
      border: toRem(2) solid var(--light-color);
      box-shadow: 0 toRem(2) toRem(8) rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: transform var(--transition-duration),
                  background var(--transition-duration);
    }

    &::-moz-range-thumb {
      width: toRem(18);
      height: toRem(18);
      border-radius: 50%;
      background: var(--primary-color);
      border: toRem(2) solid var(--light-color);
      box-shadow: 0 toRem(2) toRem(8) rgba(0, 0, 0, 0.15);
      cursor: pointer;
    }

    &::-moz-range-track {
      height: toRem(6);
      border-radius: toRem(4);
      background: var(--gray-color);
    }
  }

  &__field_password {
    padding-inline-end: toRem(36);
  }

  &__toggle-password {
    position: absolute;
    right: toRem(4);
    padding: toRem(2);
    background: none;
    border: none;
    color: var(--text-muted);

    @include hover {
      color: var(--primary-color);
    }
  }

  &__error {
    color: var(--danger-color);
    @include adaptiveValue("font-size", 12, 11);
  }
}
</style>