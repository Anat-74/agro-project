<script setup lang="ts">
interface Props {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Подтверждение',
  message: 'Вы уверены?',
  confirmText: 'Да',
  cancelText: 'Отмена',
})

const emit = defineEmits<Emits>()

const dialogEl = useTemplateRef<HTMLDialogElement>('confirm-dialog')
const { open, close } = useDialog('confirm-delete-modal', dialogEl, { useShowMethod: false })

const handleConfirm = () => {
  emit('confirm')
  close?.()
}

const handleCancel = () => {
  emit('cancel')
  close?.()
}

defineExpose({ open })
</script>

<template>
  <dialog ref="confirm-dialog" class="confirm-modal">
    <div class="confirm-modal__body">
      <h3 class="confirm-modal__title">{{ props.title }}</h3>
      <p class="confirm-modal__message">{{ props.message }}</p>

      <div class="confirm-modal__actions">
        <UButton variant="secondary" :is-disabled="false" @click="handleCancel">
          {{ props.cancelText }}
        </UButton>
        <UButton variant="primary" :is-disabled="false" @click="handleConfirm">
          {{ props.confirmText }}
        </UButton>
      </div>
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
.confirm-modal {
  padding: 0;
  border: none;
  border-radius: toRem(12);
  background: var(--secondary-color);
  max-width: toRem(400);
  width: 90vw;

  &::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }

  &__body {
    padding: toRem(32);
    display: grid;
    gap: toRem(16);
  }

  &__title {
    font-weight: 700;
    @include adaptiveValue("font-size", 20, 18);
    margin: 0;
  }

  &__message {
    color: var(--text-muted);
    font-size: toRem(15);
    margin: 0;
    line-height: 1.5;
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: toRem(12);
    margin-block-start: toRem(8);
  }
}
</style>
