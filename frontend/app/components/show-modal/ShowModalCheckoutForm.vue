<script setup lang="ts">
import { buttonTranslations } from '~/locales/button'

const dialogRef = useTemplateRef<HTMLDialogElement>('checkout-dialog')
const { open, close, isOpen } = useDialog('cartCheckout', dialogRef, { useShowMethod: false })

const { currentLocale } = useLocale()
const buttonT = computed(() => buttonTranslations[currentLocale.value])

defineExpose({ open, close, isOpen })
</script>

<template>
  <dialog ref="checkout-dialog" class="checkout-dialog">
    <div class="checkout-dialog__panel">
      <UButton
        variant="close-modal"
        icon="mingcute:close-line"
        class="checkout-dialog__close"
        :aria-label="buttonT.ariaLabelDialogClosed"
        @click="close"
      />
      <OrderForm @order-success="close" />
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
.checkout-dialog {
  // padding/border обнулены глобально в _normalize.scss (:where(dialog[class]))
  border-radius: toRem(12);
  background: var(--bg);
  max-width: toRem(420);
  width: 90dvw;
  box-shadow: 0 toRem(8) toRem(32) rgba(0, 0, 0, 0.45);
  scale: 0;
  transition:
    scale var(--transition-duration),
    overlay var(--transition-duration) allow-discrete,
    display var(--transition-duration) allow-discrete;

  &[open] {
    scale: 1;
  }

  @starting-style {
    &[open] {
      scale: 0;
    }
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.35);
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

// Вид крестика задаёт variant="close-modal" в UButton — здесь стилей не нужно
</style>
