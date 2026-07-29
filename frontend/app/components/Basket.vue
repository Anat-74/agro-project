<script setup lang="ts">
import { cartTranslations } from '~/locales/cart'

const { currentLocale } = useLocale()
const t = computed(() => cartTranslations[currentLocale.value])
const cartStore = useCartStore()

const emit = defineEmits<{
  open: []
}>()

onMounted(() => {
  cartStore.loadCart()
})
</script>

<template>
  <button
    class="cart-link"
    :aria-label="t.ariaLabelBasket"
    @click="emit('open')"
  >
    <span class="cart-link__price">{{ cartStore.totalItems }}</span>
    <Icon
      name="cil:cart"
      width="30"
      height="30"
    />
  </button>
</template>

<style lang="scss" scoped>
.cart-link {
  position: relative;
  cursor: pointer;
  padding: 0;
  border: none;
  background: transparent;

  svg {
    color: var(--primary-color);
    transition: transform var(--transition-duration);

    @include hover {
      transform: scale(1.2);
    }
  }

  &__price {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-inline: toRem(4);
    padding-block: toRem(1);
    position: absolute;
    top: toRem(-18);
    right: toRem(-6);
    font-weight: 500;
    border-radius: 50%;
    color: var(--light-color);
    background-color: var(--danger-color);
    transition: transform var(--transition-duration);

    @include hover {
      transform: scale(1.2);
    }
  }
}
</style>
