export function useNotification() {
  const show = ref(false)
  const type = ref<'success' | 'error'>('success')
  const content = ref('')
  
  const showNotification = (
    message: string, 
    notificationType: 'success' | 'error' = 'success',
    duration: number = 3000
  ) => {
    content.value = message
    type.value = notificationType
    show.value = true
    
    if (duration > 0) {
      setTimeout(() => {
        show.value = false
      }, duration)
    }
  }
  
  return {
    show,
    type,
    content,
    showNotification
  }
}