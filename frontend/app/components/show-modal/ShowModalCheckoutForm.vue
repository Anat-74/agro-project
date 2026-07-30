<script setup lang="ts">
defineExpose({ open, close, isOpen })

const dialogRef = useTemplateRef<HTMLDialogElement>('checkout-dialog')
const { open, close, isOpen } = useDialog('cartCheckout', dialogRef, { useShowMethod: false })

const cartStore = useCartStore()
</script>

<template>
  <dialog ref="checkout-dialog" class="checkout-dialog">
    <div class="checkout-dialog__panel">
      <header class="checkout-dialog__header">
        <h2 class="checkout-dialog__title">Оформление</h2>
        <button
          class="checkout-dialog__close"
          aria-label="Закрыть"
          @click="close"
        >
          <Icon name="mingcute:close-line" />
        </button>
      </header>
      <OrderForm @order-success="close" />
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
.checkout-dialog {
  padding: 0;
  border: none;
  border-radius: toRem(12);
  background: var(--bg);
  max-width: toRem(420);
  width: 90dvw;
  box-shadow: 0 toRem(8) toRem(32) rgba(0, 0, 0, 0.15);
  scale: 0;
  opacity: 0;
  transition:
    scale var(--transition-duration),
    opacity var(--transition-duration),
    overlay var(--transition-duration) allow-discrete,
    display var(--transition-duration) allow-discrete;

  &[open] {
    scale: 1;
    opacity: 1;
  }

  @starting-style {
    &[open] {
      scale: 0;
      opacity: 0;
    }
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition:
      opacity var(--transition-duration),
      overlay var(--transition-duration) allow-discrete,
      display var(--transition-duration) allow-discrete;
  }

  &[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    &[open]::backdrop {
      opacity: 0;
    }
  }
}

.checkout-dialog__panel {
  display: grid;
  gap: toRem(16);
  padding: toRem(24);
}

.checkout-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checkout-dialog__title {
  font-weight: 700;
  @include adaptiveValue("font-size", 20, 18);
  margin: 0;
}

.checkout-dialog__close {
  display: grid;
  place-items: center;
  width: toRem(32);
  height: toRem(32);
  border-radius: 50%;
  cursor: pointer;
  transition: background var(--transition-duration);

  @include hover {
    background: var(--bg-secondary);
  }

  svg {
    font-size: toRem(20);
    color: var(--color);
  }
}
</style>
