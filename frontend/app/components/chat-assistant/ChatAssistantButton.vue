<script setup lang="ts">
type Variant =
  | "send"
  | "voice"
  | "suggestion"
  | "close"
  | "delete"
  | "chat-toggle"
  | "cart-add"
  | "cart-remove"
  | "cart-update"
  | "cart-clear"
  | "cart-show"
  | "cart-cancel"

interface Props {
  variant?: Variant
  isDisabled?: boolean
  isListening?: boolean
  icon?: string
  type?: "button" | "submit"
}

const { variant = "send", isDisabled = false, isListening = false,
  icon = "", type = "button" } = defineProps<Props>()

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()
</script>

<template>
  <button
    :class="[
      'chat-btn',
      `chat-btn_${variant}`,
      { 'chat-btn_listening': variant === 'voice' && isListening },
    ]"
    :disabled="isDisabled"
    :type="type"
    @click="emit('click', $event)"
  >
    <Icon v-if="variant === 'send'" name="material-symbols:send" />
    <Icon v-else-if="icon" :name="icon" />
    <Icon v-else-if="variant === 'close'" name="material-symbols-light:close" />
    <Icon v-else-if="variant === 'delete'" name="material-symbols:delete-outline-rounded" />
    <slot v-else />
  </button>
</template>

<style lang="scss" scoped>
.chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-duration);
  font-family: inherit;

  &:disabled {
    cursor: not-allowed;
  }

  &_send {
    width: toRem(48);
    height: toRem(48);
    background: var(--success-color);
    color: var(--light-color);
    border: none;
    border-radius: 50%;

    @include hover {
      &:not(:disabled) { background: #388e3c; }
    }

    &:disabled {
      background: var(--gray-color);
    }
  }

  &_voice {
    border-radius: 50%;
    border: toRem(1) solid var(--border-color);
    background-color: var(--light-color);
    color: var(--warnig-color);
    flex-shrink: 0;
    @include adaptiveValue("width", 40, 34);
    @include adaptiveValue("height", 40, 34);

    @include hover {
      &:not(:disabled) {
        border-color: var(--success-color);
        color: var(--success-color);
      }
    }

    &:disabled {
      opacity: 0.5;
    }

    &.chat-btn_listening {
      background: var(--danger-color);
      color: var(--light-color);
      border-color: var(--danger-color);
      animation: pulse 1.5s infinite;
    }
  }

  &_suggestion {
    padding: toRem(10) toRem(16);
    background: var(--light-color);
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(8);
    text-align: left;
    color: var(--color);

    @include hover {
      background: var(--bg);
      border-color: var(--success-color);
      color: var(--success-color);
    }
  }

  &_close {
    background: transparent;
    border: none;
    font-size: toRem(20);
    color: var(--light-color);

    @include hover {
      transform: scale(1.15);
    }
  }

  &_cart-add {
    background: var(--gradient-chat-primary);
    border: none;
    border-radius: toRem(50);
    padding: toEm(4) toEm(12);
    color: var(--light-color);
  }

  &_cart-remove {
    background: var(--gradient-chat-red);
    border: none;
    border-radius: toRem(50);
    padding: toEm(4) toEm(12);
    color: var(--light-color);
  }

  &_cart-cancel {
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(50);
    padding: toEm(4) toEm(12);
    background: transparent;
    color: var(--color);
  }

  &_delete {
    background: transparent;
    border: none;
    font-size: toRem(20);
    color: var(--light-color);

    @include hover {
      transform: scale(1.15);
      color: var(--danger-color);
    }
  }

  &_chat-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: toRem(40);
    height: toRem(40);
    border-radius: 50%;
    border: toEm(2) solid var(--primary-color);
    background: var(--light-color);
    color: var(--primary-color);
    cursor: pointer;
    transition: transform var(--transition-duration), border-color var(--transition-duration);

    @include hover {
      &:not(:disabled) {
        transform: scale(1.1);
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
