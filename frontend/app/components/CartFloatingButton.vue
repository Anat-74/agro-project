<script setup lang="ts">
import { cartTranslations } from '~/locales/cart'

// Плавающая кнопка корзины для планшета и телефона.
// Фиксирована внизу справа и НЕ участвует в потоке — контент не сдвигается.
// Появляется, когда в корзине есть товары, и открывает окно корзины
// (запрос обрабатывает AppHeader — диалог корзины живёт там).
// Размещена справа: кнопка «наверх» стоит по центру низа, так они не мешают друг другу.
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
    class="cart-floating visible-tablet"
    :aria-label="t.ariaLabelBasket"
    @click="openCart"
  >
    <Icon name="cil:cart" />
    <span class="cart-floating__count">{{ cartStore.totalItems }}</span>
  </UButton>
</template>

<style lang="scss" scoped>
.cart-floating {
  position: fixed;
  right: toRem(12);
  bottom: toRem(12);
  // Ниже диалогов и уведомлений, выше контента страницы
  z-index: 990;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: toRem(52);
  height: toRem(52);
  border-radius: 50%;
  background-color: var(--green-color);
  color: var(--light-color);
  font-size: toRem(24);
  box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.2);
  transition:
    box-shadow var(--transition-duration),
    scale var(--transition-duration);

  @include hover {
    scale: 1.05;
    box-shadow: 0 toRem(6) toRem(16) rgba(0, 0, 0, 0.25);
  }

  // Счётчик товаров: абсолютное позиционирование — кнопка не растёт,
  // соседние элементы не сдвигаются
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
  }
}
</style>
