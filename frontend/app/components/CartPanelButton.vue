<script setup lang="ts">
import { cartTranslations } from '~/locales/cart'

// Кнопка корзины для панели каталога (слайд «Посадка», планшет и телефон).
// Показывает количество товаров и открывает окно корзины.
// Где именно она стоит — решает родитель (в панели она прикреплена к правому
// верхнему углу слайда и в потоке не участвует, поэтому контент не сдвигается).
const { currentLocale } = useLocale()
const t = computed(() => cartTranslations[currentLocale.value])
const cartStore = useCartStore()
const { requestOpen } = useCartDialog()

const openCart = () => requestOpen()
</script>

<template>
  <UButton
    v-show="cartStore.totalItems > 0"
    variant="plain"
    class="cart-panel"
    :aria-label="t.ariaLabelBasket"
    @click="openCart"
  >
    <Icon name="cil:cart" />
    <span
      :key="cartStore.totalItems"
      class="cart-panel__count"
    >{{ cartStore.totalItems }}</span>
  </UButton>
</template>

<style lang="scss" scoped>
.cart-panel {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: toRem(40);
  height: toRem(40);
  border-radius: 50%;
  background-color: var(--green-color);
  color: var(--light-color);
  font-size: toRem(20);
  box-shadow: 0 toRem(2) toRem(8) rgba(0, 0, 0, 0.2);
  transition:
    box-shadow var(--transition-duration),
    scale var(--transition-duration);

  @include hover {
    scale: 1.05;
    box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.25);
  }

  // Счётчик: абсолютное позиционирование — кнопка не растёт
  &__count {
    position: absolute;
    top: toRem(-4);
    right: toRem(-4);
    min-width: toRem(20);
    padding-inline: toRem(4);
    border-radius: toRem(10);
    background-color: var(--danger-color);
    color: var(--light-color);
    font-size: toRem(12);
    font-weight: 700;
    line-height: toRem(20);
    text-align: center;
    // Ключ меняется вместе с количеством — анимация проигрывается заново
    animation: cartPanelCountPop 0.25s ease;
  }
}

@keyframes cartPanelCountPop {
  0% {
    scale: 1;
  }

  50% {
    scale: 1.3;
  }

  100% {
    scale: 1;
  }
}
</style>
