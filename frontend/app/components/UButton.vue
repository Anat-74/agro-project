<script setup lang="ts">
interface Props{
   nameClass?: string
   disabled?: boolean
   icon?: string
   label?: string | number
   size?: string
   loading?: boolean
   theme?: string
}
const { size = 'normal' } = defineProps<Props>()

const colorMode = useColorMode()

const emit = defineEmits(['click'])
const clickOnButton = () => {
   emit('click')
}
</script>

<template>
   <button 
      type="button"
      :disabled="disabled"
      @click="clickOnButton"
      :class="[
      'btn', `btn_${nameClass}`,
      { 'btn_icon': icon }, { 'btn_large': size === 'large' },
      { 'btn_loading': loading },
      { 'btn_preferred': !colorMode.unknown && theme === colorMode.preference,
      'btn_selected': !colorMode.unknown && theme === colorMode.value}
   ]"
      >
   <span v-if="icon">
      <Icon :name="icon"
      />
   </span>
   <span v-else>{{ label }}</span>
   </button>
</template>

<style lang="scss" scoped>
.btn {
   padding-inline: toRem(12);
   padding-block: toRem(8);
   border-radius: toRem(4);
   color: var(--light-color);
   background-color: transparent;
   border: none;

   &:disabled {
    opacity: .4;
    cursor: default;
  }
    span {
      display: flex;
      justify-content: center;
    }

    &_icon {
      padding: 0;
      font-size: toEm(24);
  }

   &_color-theme {
      padding: toRem(2);
      border: toRem(2) solid var(--secondary-color);
      border-radius: toRem(6);
      transition: transform var(--transition-duration);

      @include hover {
         transform: scale(1.4) rotate(-25deg);
      }
      svg {
         color: var(--green-color);
         @include adaptiveValue("font-size", 18, 20);
      }
   }
   &_preferred {
         svg  {
            color: var(--primary-color);
         }
   }
   &_selected {
         svg  {
         color: var(--active-color);
         }
  }

   &_hamburger {
   display: none;
   @media (max-width:$tablet){
      display: block;
      position: absolute;
      z-index: 100;
      right: toRem(15);
      width: toRem(26);
      height: toRem(18);
      @include adaptiveValue("top", 32, 23);

         span,
      &::before,
      &::after{
         content: '';
			right: 0;
			position: absolute;
			width: 100%;
			height: toRem(2);
			background-color: var(--primary-color);
         transition: transform .4s .2s, height var(--transition-duration);
      }
      &::before {
			top: 0;
		}
		&::after {
			bottom: 0;
		}
		span {
         width: 70%;
			top: calc(50% - toRem(1));
		   }

         @include hover {
         span,
         &::before,
         &::after {
            height: toRem(3);
         }
      }
      }
  }

  &_dialog-menu {
   position: fixed;
   right: toRem(18);
   top: 50%;
   translate: 0 -50%;
   padding: toEm(4);
   border-radius: 50%;
   outline: toEm(3) solid var(--warning-color);
   outline-offset: toRem(6);
   background-color: var(--warning-hover);
   transition: scale var(--transition-duration);

      @include hover {
      scale: 1.1;
   }

   svg {
      font-size: toEm(25, 24);
      color: var(--light-color);
   }

   @media (max-width:$tablet){
      right: toRem(15);
      outline: toEm(2) solid var(--warning-color);
      outline-offset: toRem(2);
   }
  }

  &_lang-switcher {
   transition: scale var(--transition-duration);
   @include hover {
      scale: 1.2;
   }

   @media (max-width:$mobile){
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

   &:disabled {
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

   &:disabled {
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

   @media (max-width:$mobile){
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

   @media (max-width:$mobile){
      width: toRem(26);
      height: toRem(26);
   }

   &::before{
         content: '';
			left: 50%;
			position: absolute;
			width: toRem(16);
         top: 50%;
         translate: -50% -50%;
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

   @media (max-width:$mobile){
      width: toRem(26);
      height: toRem(26);
   }

   &::before,
      &::after{
         content: '';
			left: 50%;
			position: absolute;
			width: toRem(18);
         top: 50%;
         translate: -50% -50%;
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

   @media (max-width:$mobile){
       border-width: 1px; 
   }
}

&_pagination {
   padding-inline: toEm(12);
   padding-block: toEm(7);
   font-weight: 600;
   color: var(--light-color);
   background-color: var(--sky-blue-color);
}

  &_close {
   position: absolute;
    z-index: 10;
    top: toEm(11);
    right: toEm(7);
    padding-inline: toEm(14);
    padding-block: toEm(14);

       &::before,
      &::after{
         content: '';
         position: absolute;
			right: toRem(3);
			width: toRem(20);
			height: toRem(2);
         background-color: var(--border-color);
      }
      &::before {
         top: calc(50% - toRem(1));
         transform: rotate(-45deg);
		}
		&::after {
         bottom: calc(50% - toRem(1));
         transform: rotate(45deg);
		}

      @include hover {
         transform: scale(1.1);
      }
  }
}
</style>