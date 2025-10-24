export const useGoToForwardOrBack = () => {
   const router = useRouter()
   const { currentLocale } = useLocale()
   const goBack = () => {
      if (window.history.length > 1) {
         router.back()
      } else {
         router.push(`/${currentLocale}`)
      }
   }
   
   const goForward = () => {
      router.forward()
   }
      return { goBack, goForward }
}