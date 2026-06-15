<script setup lang="ts">
type InputType = 'text' | 'textarea' | 'search' | 'email' | 'password' | 'number' | 'tel' | 'url'

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
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  label: '',
  placeholder: '',
  rows: 3,
  disabled: false,
  readonly: false,
  required: false,
  error: '',
  icon: ''
})

const model = defineModel<string | number>()
</script>

<template>
  <div class="u-input" :class="{ 'u-input_error': error }">
    <label v-if="label" class="u-input__label">
      {{ label }}
      <span v-if="required" class="u-input__required">*</span>
    </label>

    <textarea
      v-if="type === 'textarea'"
      v-model="model"
      :placeholder="placeholder"
      :rows="rows"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      class="u-input__field u-input__field_textarea"
    />

    <div v-else class="u-input__wrapper">
      <Icon v-if="icon" :name="icon" class="u-input__icon" />
      <input
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        class="u-input__field"
      />
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

  &__required {
    color: var(--danger-color);
  }

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

  &__error {
    color: var(--danger-color);
    @include adaptiveValue("font-size", 12, 11);
  }
}
</style>
