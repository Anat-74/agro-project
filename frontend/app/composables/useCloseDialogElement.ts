// export const useCloseDialogElement = (dialogElement: HTMLDialogElement) => {

//    function closeOnBackDropClick({ currentTarget, target }: MouseEvent): void {
//      const dialogEl = currentTarget as HTMLDialogElement
//      const isClickedOnBackDrop = target === dialogEl
//      if (isClickedOnBackDrop) {
//        dialogEl.close()
//      }
//    }

//    dialogElement.addEventListener("click", closeOnBackDropClick)
// console.log('Добавлен обработчик для диалога')
//    return () => {
//          console.log('Удалён обработчик для диалога')
//     dialogElement.removeEventListener("click", closeOnBackDropClick)
//   }
// }

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