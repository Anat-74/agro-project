<script setup lang="ts">
const colorMode = useColorMode();

interface Props {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "icon"
    | "hamburger"
    | "dialog-menu"
    | "lang-switcher"
    | "go-forward-back"
    | "share"
    | "switch-locale-cart"
    | "add-to-cart"
    | "add"
    | "is-added"
    | "remove-cart-item"
    | "remove-quantity-prod"
    | "add-quantity-prod"
    | "large"
    | "go-to-top"
    | "pagination"
    | "close"
    | "share"
    | "slide-next"
    | "product-details"
    | "color-theme"
    | "slide-prev"
    | "cart-pill"
  size?: "small" | "normal" | "large";
  isLoading?: boolean;
  isDisabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: string;
  theme?: string;
  isOpen?: boolean;
  isInCart?: boolean;
}

interface Emits {
  (e: "click", event: MouseEvent): void;
}

const { variant = "primary", size = "normal", isLoading = false,
  isDisabled = false, type = "button", isOpen = false, isInCart = false, icon = "", theme = "" } = defineProps<Props>()

defineEmits<Emits>();
</script>

<template>
  <button
    :class="[
      'btn',
      `btn_${variant}`,
      { 'btn_loading': isLoading, btn_disabled: isDisabled },
      { 'btn_selected': !colorMode.unknown && theme === colorMode.value },
      { 'btn_hamburger_is-open': isOpen && variant === 'hamburger' },
      { 'btn_add_is-added': isInCart && variant === 'add' },
      size === 'large' ? 'btn_large' : '',
      icon ? 'btn_icon' : '',
    ]"
    :disabled="isDisabled || isLoading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <span v-if="isLoading" class="button-spinner"/>
    <span v-else-if="icon" class="btn-icon">
      <Icon :name="icon" />
    </span>
    <span v-else class="button-content">
      <slot/>
    </span>
  </button>
</template>

<style lang="scss" scoped>
.btn {
  padding-inline: toRem(12);
  padding-block: toRem(8);
  border-radius: toRem(4);
  color: var(--color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
//   gap: 8px;
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

  &_primary {
    background-color: var(--primary-color);
    color: var(--light-color);
    border: 1px solid var(--color);
    transition: background-color var(--transition-duration), color var(--transition-duration), transform var(--transition-duration);

    &:active {
      transform: scale(0.97);
    }

    @include hover {
      background-color: var(--secondary-color);
      color: var(--color);
    }
  }

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
      font-size: toEm(15);
      @include adaptiveValue("font-size", 18, 20);

      @media (max-width: $tablet) {
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

    @media (max-width: $mobile) {
      padding-inline: toRem(27);
      border-radius: 0 toRem(25) toRem(4) 0;
    }

    span,
    &::before,
    &::after {
      content: "";
      left: 50%;
      translate: -50% 0;
      position: absolute;
      width: toRem(24);
      height: toRem(2);
      background-color: var(--secondary-color);
      transition: rotate .4s, opacity var(--transition-duration);
    }

    &::before {
      // top: toEm(20);
      @include adaptiveValue("top", 21, 10);
    }

    &::after {
      // bottom: toEm(20);
      @include adaptiveValue("bottom", 21, 10);
    }

    span {
      top: calc(50% - toRem(1));
    }

    @include hover {
      opacity: .7;
    }

    &_is-open {
      @media (max-width:$mobile){
         width: 100%;
         padding-inline: 0;
         padding-block: toRem(18);
         border-radius: toRem(2);
      }

      span {
        width: 0;
      }

      &::before,
      &::after {
        background-color: var(--light-color);

        @media (max-width: $mobile) {
          transition: rotate .5s .2s;
        }
      }

      &::before {
        top: calc(50% - toRem(1));
        rotate: -45deg;
      }

      &::after {
        bottom: calc(50% - toRem(1));
        rotate: 45deg;
      }
    }
  }

  &_lang-switcher {
    border-radius: 50%;
    transition: scale var(--transition-duration);

    @include hover {
      scale: 1.2;
    }

    svg {
      font-size: toRem(22);
    }
  }

  &_slide-prev,
  &_slide-next{
    position: absolute;
    top: 50%;
    translate: 0 -50%;
    width: toEm(36);
    height: toEm(36);
    border-radius: 50%;
    background-color: var(--light-color);
    transition: all var(--transition-duration);

    @media (max-width:$mobileSmall){
      display: none;
    }

    svg {
      font-size: toEm(24);
      color: var(--success-color);
    }

    @include hover {
      &:not(:disabled) {
       background-color: var(--success-color);

       svg {
         scale: 1.2;
         color: var(--light-color);
       }
      }
    }
  }

  &_slide-prev {
   left: 3%;
  }

   &_slide-next {
   right: 3%;

    svg {
       rotate: 180deg;
    }
  }

  &_go-forward-back {
    align-self: start;
    padding: toRem(4);
    border-radius: toRem(6);
    border: 1px solid var(--secondary-color);
    transition: color var(--transition-duration),
    scale var(--transition-duration);

    svg {
      color: var(--warning-color);
      @include adaptiveValue("font-size", 18, 20);

      @include hover {
        color: var(--danger-color);
        scale: 1.1;
      }
    }
  }

  &_product-details {
   font-size: toEm(26);
   background-color: var(--whitesmoke-color);
   padding-block: toEm(4);
   padding-inline: toEm(5);
   border-radius: 50%;
   color: var(--warning-color);
   transition: all var(--transition-duration);

   @include hover {
      color: var(--light-color);
      background-color: var(--warning-color);
   }

   svg {
      font-size: toRem(28);
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
      opacity: 0.7;
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

   &_add {
   position: relative;
   opacity: .4;
   border-radius: toEm(6);
   border: toRem(1) solid var(--success-color);
   background-color: var(--light-color);
   @include adaptiveValue("padding", 16, 14);


       &::before,
       &::after{
         content: '';
         position: absolute;
			width: toRem(15);
			height: toRem(2);
			background-color: var(--green-color);
         transition: all .2s ease;
         @include adaptiveValue("right", 9, 6);
      }
      &::before {
         top: calc(50% - toRem(1));
         transform: rotate(-90deg);
		}
		&::after {
         bottom: calc(50% - toRem(1));
         transform: rotate(180deg);
		}

   @include hover {
      border-color: var(--warning-hover);
      &::before,
      &::after {
         background-color: var(--warning-hover);
       }
   }

   &_is-added {
    opacity: .8;
    border-color: var(--success-color);
    background-color: var(--success-color);

      &::before,
      &::after{
			background-color: var(--light-color);
      }
      &::before {
         top: 45%;
         transform: rotate(-58deg);
         @include adaptiveValue("right", 7, 5);
		}
		&::after {
         width: toRem(8);
         right: 50%;
         bottom: 40%;
         transform: rotate(60deg);
		}

      @include hover {
         border-color: var(--green-color);
         background-color: var(--green-color);
         &::before,
         &::after {
            background-color: var(--light-color);
       }
      }
    }
  }

  &_remove-cart-item {
    svg {
      color: var(--warning-color);
      font-size: toRem(24);
      transition: color var(--transition-duration),
        scale var(--transition-duration);

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
      content: "";
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
      content: "";
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
    border: toRem(1) solid var(--success-color);
    transition: color var(--transition-duration);
    @include adaptiveValue("width", 36, 30);
    @include adaptiveValue("height", 36, 30);

    svg {
      color: var(--success-color);
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
    transition: background-color var(--transition-duration),
      color var(--transition-duration);

    @include hover {
      background-color: var(--secondary-color);
      color: var(--color);
    }
  }

  &_close {
    background: none;
    border: none;
    cursor: pointer;
    padding: toRem(8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--light-color);
    transition: all var(--transition-duration);
    border-radius: toRem(4);

    svg, .icon {
      color: inherit;
      fill: currentColor;
      transition: transform var(--transition-duration);
    }

    @include hover {
      background: rgba(255, 255, 255, 0.1);
      svg, .icon { transform: scale(1.1); }
    }

    &:active {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(0.95);
    }
  }

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

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  50% { box-shadow: 0 0 0 toRem(8) rgba(244, 67, 54, 0); }
}
</style>
