export const useDialog = (dialogElement: Ref<HTMLDialogElement | null>) => {

    const isOpen = ref(false)

   const open = () => {
      dialogElement.value?.showModal?.()
      isOpen.value = true
   }
   const close = () => {
      dialogElement.value?.close?.()
      isOpen.value = false
   }
  
  // Обработчик клика на бэкдроп
  const closeOnBackdropClick = (e: MouseEvent) => {
    if (!dialogElement.value) return
    if (e.target === dialogElement.value) {
      close()
    }
  }

  // Добавление обработчика событий
  onMounted(() => {
     if (!dialogElement.value) return
    dialogElement.value.addEventListener('click', closeOnBackdropClick)
  })

  // Удаление обработчика при размонтировании
   onUnmounted(() => {
    dialogElement.value?.removeEventListener('click', closeOnBackdropClick)
  })

  return {
    open,
    close,
    isOpen
  }
}