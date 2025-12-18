<script setup lang="ts">
const colorMode = useColorMode()

interface Props {
    variant?:
    'primary'| 'secondary' | 'outline' | 'icon' | 'hamburger' |
    'dialog-menu' | 'lang-switcher' | 'go-forward-back' | 'share' |
    'switch-locale-cart' | 'add-to-cart' | 'small-add-to-cart' | 'remove-cart-item' |
    'remove-quantity-prod' | 'add-quantity-prod' | 'large' | 'go-to-top' |
    'pagination' | 'close' | 'color-theme'
    size?: 'small' | 'normal' | 'large'
    isLoading?: boolean
    isDisabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    icon?: string
    theme?: string
  }

interface Emits {
  (e: 'click', event: MouseEvent): void
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'normal',
  isLoading: false,
  isDisabled: false,
  type: 'button'
})

defineEmits<Emits>()
</script>

<template>
  <button
    :class=" [
      'btn',
      `btn_${variant}`,
      { 'btn_loading': isLoading, 'btn_disabled': isDisabled },
      { 'btn_selected': !colorMode.unknown && theme === colorMode.value },
      size === 'large' ? 'btn_large' : '',
      icon ? 'btn_icon' : '',
    ]"
    :disabled="isDisabled || isLoading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <span v-if="isLoading" class="button-spinner"></span>
    <span v-else-if="icon" class="btn-icon">
      <Icon :name="icon" />
    </span>
    <span v-else class="button-content">
      <slot></slot>
    </span>
  </button>
</template>

<style lang="scss" scoped>
.btn {
  padding-inline: toRem(12);
  padding-block: toRem(8);
  border-radius: toRem(4);
  color: var(--color);
  background-color: transparent;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all .2s ease;

 &:disabled,
  &.btn_disabled {
    opacity: .4;
    cursor: default;
  }

  &:focus-visible {
    outline: 4px solid var(--warning-color);
  }

  span {
    display: flex;
    justify-content: center;
  }

//   &_primary {
//     background-color: var(--color);
//     color: var(--light-color);
//     border: 1px solid var(--color);
//     transition: background-color var(--transition-duration), color var(--transition-duration);
    
//     @include hover {
//       background-color: var(--secondary-color);
//       color: var(--color);
//     }
//   }
  
//   &_secondary {
//     background-color: var(--secondary-color);
//     color: var(--color);
//     border: 1px solid var(--secondary-color);
//     transition: background-color var(--transition-duration), color var(--transition-duration);
    
//     @include hover {
//       background-color: var(--color);
//       color: var(--light-color);
//     }
//   }
  
//   &_outline {
//     background-color: transparent;
//     color: var(--color);
//     border: 1px solid var(--color);
//     transition: background-color var(--transition-duration), color var(--transition-duration);
    
//     @include hover {
//       background-color: var(--color);
//       color: var(--light-color);
//     }
//   }

  &_icon {
    padding: 0;
    font-size: toEm(22);
  }

  &_color-theme {
    padding: toRem(2);
    border: toRem(2) solid var(--whitesmoke-color);
    border-radius: toRem(6);

    span {
      transition: transform var(--transition-duration);
      @include hover {
         transform: scale(1.4) rotate(-25deg);
      }
    }

    svg {
      color: var(--light-color);
      @include adaptiveValue("font-size", 18, 20);

      @media (max-width:$tablet){
         color: var(--success-color);
      }
    }
  }

  &_selected {
   background-color: var(--light-color);
   cursor: default;

      span {
      transition: transform var(--transition-duration);
      @include hover {
         transform: scale(1) rotate(0);
      }
    }

    svg {
      color: var(--active-color);
    }
  }

 &_hamburger {
      position: relative;
      height: 100%;
      padding-inline: toRem(32);
      background-color: var(--success-color);
      border-radius: toRem(0);

      @media (max-width:$mobile){
         padding-inline: toRem(28);
         border-radius: 0 toRem(25) toRem(4) 0;
      }

      span,
      &::before,
      &::after {
        content: '';
        left: 50%;
        translate: -50% 0;
        position: absolute;
        width: toRem(24);
        height: toRem(2);
        background-color: var(--secondary-color);
        transition: rotate var(--transition-duration), opacity var(--transition-duration);
      }

      &::before {
        top: toRem(0);
        @include adaptiveValue("top", 18, 12);
      }

      &::after {
        bottom: toRem(0);
      @include adaptiveValue("bottom", 18, 12);
      }

      span {
        top: calc(50% - toRem(1));
      }

      @include hover {
         opacity: .8;
   }
}

//   &_dialog-menu {
//     position: fixed;
//     right: toRem(18);
//     top: 50%;
//     translate: 0 -50%;
//     padding: toEm(4);
//     border-radius: 50%;
//     outline: toEm(3) solid var(--warning-color);
//     outline-offset: toRem(6);
//     background-color: var(--warning-hover);
//     transition: scale var(--transition-duration);

//     @include hover {
//       scale: 1.1;
//     }

//     svg {
//       font-size: toEm(25, 24);
//       color: var(--light-color);
//     }

//     @media (max-width: $tablet) {
//       right: toRem(15);
//       outline: toEm(2) solid var(--warning-color);
//       outline-offset: toRem(2);
//     }
//   }

 &_lang-switcher {
    border-radius: 50%;
    transition: scale var(--transition-duration);

    @include hover {
      scale: 1.2;
    }

    @media (max-width: $mobile) {
      svg {
        font-size: toRem(22);
      }
    }
 }

  &_go-forward-back {
    align-self: start;
    padding: toRem(4);
    border-radius: toRem(6);
    border: 1px solid var(--secondary-color);
    transition: color var(--transition-duration), scale var(--transition-duration);

    svg {
      color: var(--warning-color);
      @include adaptiveValue("font-size", 18, 20);

      @include hover {
        color: var(--danger-color);
        scale: 1.1;
      }
    }
  }

  &_share {
    padding: toRem(2);
    border: 2px solid var(--warning-color);
    transition: color var(--transition-duration);

    svg {
      font-size: toEm(22, 24);
      color: var(--warning-color);

      @include hover {
        color: var(--danger-color);
      }
    }
  }

  &_switch-locale-cart {
    padding-inline: toEm(6);
    padding-block: toEm(2);
    background-color: var(--warning-color);
  }

  &_add-to-cart {
    font-weight: 600;
    border-radius: toRem(6);
    border: 1px solid var(--light-color);
    box-shadow: 0 toRem(4) toRem(0) rgba(0, 0, 0, 0.2);
    color: var(--danger-hover);
    background-color: var(--secondary-color);
    transition: background-color var(--transition-duration), color var(--transition-duration);

    &:disabled,
    &.btn_disabled {
      opacity: .7;
    }

    svg {
      font-size: toEm(30, 24);
      padding: toRem(4);
    }

    @include hover {
      &:enabled {
        color: var(--light-color);
        background-color: var(--danger-hover);
      }
    }
  }

  &_small-add-to-cart {
    padding: toRem(3);
    outline: toRem(1) solid var(--primary-color);
    border-radius: 50%;

    &:disabled,
    &.btn_disabled {
      opacity: 1;
    }

    svg {
      font-size: toEm(22, 24);
      color: var(--primary-color);
      transition: color var(--transition-duration);

      @include hover {
        color: var(--warning-color);
      }
    }

    .iconify--emojione-v1 {
      padding: toRem(3);
    }

    @media (max-width: $mobile) {
      outline-width: 1px;
    }
  }

  &_remove-cart-item {
    svg {
      color: var(--warning-color);
      font-size: toRem(24);
      transition: color var(--transition-duration), scale var(--transition-duration);

      @include hover {
        color: var(--danger-color);
        scale: 1.1;
      }
    }
  }

  &_remove-quantity-prod {
    position: relative;
    width: toRem(32);
    height: toRem(32);
    background-color: var(--border-color);
    transition: background-color var(--transition-duration);

    @include hover {
      &:enabled {
        background-color: var(--warning-hover);
      }
    }

    @media (max-width: $mobile) {
      width: toRem(26);
      height: toRem(26);
    }

    &::before {
      content: '';
      left: 50%;
      position: absolute;
      width: toRem(16);
      top: 50%;
      translate: -50%;
      height: toRem(2);
      background-color: var(--light-color);
    }
  }

  &_add-quantity-prod {
    position: relative;
    width: toRem(32);
    height: toRem(32);
    background-color: var(--border-color);
    transition: background-color var(--transition-duration);

    @include hover {
      background-color: var(--warning-hover);
    }

    @media (max-width: $mobile) {
      width: toRem(26);
      height: toRem(26);
    }

    &::before,
    &::after {
      content: '';
      left: 50%;
      position: absolute;
      width: toRem(18);
      top: 50%;
      translate: -50%;
      height: toRem(2);
      background-color: var(--light-color);
    }

    &::after {
      transform: rotate(90deg);
    }
  }

 &_large {
    font-weight: 600;
    border-radius: toRem(25);
    background-color: var(--danger-color);
    transition: background-color var(--transition-duration);

    @include hover {
      &:enabled {
        background-color: var(--danger-hover);
      }
    }
 }

  &_go-to-top {
    position: fixed;
    z-index: 999;
    right: toRem(15);
    bottom: toRem(14);
    padding: toRem(4);
    border: toRem(1) solid var(--dark-golden-color);
    transition: color var(--transition-duration);
    @include adaptiveValue("width", 36, 30);
    @include adaptiveValue("height", 36, 30);

    svg {
      color: var(--dark-golden-color);
    }

    @include hover {
      background-color: var(--warning-hover);
    }

    @media (max-width: $mobile) {
      border-width: 1px;
    }
  }

  &_pagination {
    padding-inline: toEm(12);
    padding-block: toEm(7);
    font-weight: 600;
    color: var(--light-color);
    background-color: var(--color);
    border: 1px solid var(--color);
    transition: background-color var(--transition-duration), color var(--transition-duration);
    
    @include hover {
      background-color: var(--secondary-color);
      color: var(--color);
    }
  }

//   &_close {
//    display: none;

//    @media (max-width:$mobile){
//     display: block;
//     position: absolute;
//     z-index: 10;
//     top: toEm(11);
//     right: toEm(7);
//     padding-inline: toEm(14);
//     padding-block: toEm(14);
//     border-radius: toRem(4);
//     border: toRem(2) solid var(--dark-color);

//     &::before,
//     &::after {
//       content: '';
//       position: absolute;
//       right: toRem(4);
//       width: toRem(20);
//       height: toRem(2);
//       background-color: var(--dark-color);
//     }

//     &::before {
//       top: calc(50% - toRem(1));
//       rotate: -45deg;
//     }

//     &::after {
//       bottom: calc(50% - toRem(1));
//       rotate: 45deg;
//     }

//     @include hover {
//       scale: 1.1;
//     }
//    }
//   }

  /* Состояние загрузки */
  &.loading {
    pointer-events: none;
 }
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