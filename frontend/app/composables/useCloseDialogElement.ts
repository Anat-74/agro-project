export interface UseDialogOptions {
  useShowMethod?: boolean; // Если true, используем show() вместо showModal()
}

export const useDialog = (
  dialogElement: Ref<HTMLDialogElement | null>,
  options: UseDialogOptions = {}
) => {
  const isOpen = ref(false);
  const { useShowMethod = false } = options;

  const open = () => {
    if (dialogElement.value) {
      if (useShowMethod) {
        // Используем show() метод для немодального диалога
        dialogElement.value.show();
      } else {
        // Используем showModal() метод для модального диалога
        dialogElement.value.showModal();
      }
    }
    isOpen.value = true;
  };

  const close = () => {
    dialogElement.value?.close?.();
    isOpen.value = false;
  };

  // Обработчик клика на бэкдроп - только для showModal()
  const closeOnBackdropClick = (e: MouseEvent) => {
    if (!dialogElement.value) return;
    if (e.target === dialogElement.value) {
      close();
    }
  };

  // Добавление обработчика событий
  onMounted(() => {
    if (!dialogElement.value) return;
    // Добавляем обработчик клика только если используем showModal()
    if (!useShowMethod) {
      dialogElement.value.addEventListener("click", closeOnBackdropClick);
    }
  });

  // Удаление обработчика при размонтировании
  onUnmounted(() => {
    if (!useShowMethod) {
      dialogElement.value?.removeEventListener("click", closeOnBackdropClick);
    }
  });

  return {
    open,
    close,
    isOpen,
  };
};
