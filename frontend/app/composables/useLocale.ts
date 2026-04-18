export const useLocale = () => {
   const route = useRoute()
   const router = useRouter()
   
   const langCookie = useCookie<string>('lang', {
     maxAge: 30 * 24 * 60 * 60, // 30 дней
     sameSite: 'lax'
   })

   // Вспомогательная функция для валидации locale
   const validateLocale = (locale: string): LocaleCode => {
     const validLocales: LocaleCode[] = ['ru', 'be']
     return (validLocales.includes(locale as LocaleCode) ? locale : 'ru') as LocaleCode
   }

   // Безопасная инициализация с валидацией
   const _currentLocale = ref<LocaleCode>(
     validateLocale((route.params?.lang as string) || langCookie.value || 'ru')
   )

   // Computed для реактивного доступа с валидацией
   const currentLocale = computed({
     get: () => _currentLocale.value,
     set: (value: LocaleCode) => {
       const validValue = validateLocale(value)
       _currentLocale.value = validValue
       langCookie.value = validValue
       if (route.params.lang !== validValue) {
        router.replace({
           params: { ...route.params, lang: validValue },
           query: route.query
         })
       }
     }
   })

    watch(() => route.params.lang, (newVal) => {
      if (newVal && newVal !== currentLocale.value) {
        // Преобразуем newVal в строку (может быть string | string[] | undefined)
        const langString = Array.isArray(newVal) ? newVal[0] : newVal
        if (langString) {
          currentLocale.value = validateLocale(langString)
        }
      }
    })

   const locales = [
     {
       code: 'ru',
       icon: 'emojione:flag-for-russia'
     },
     {
       code: 'be',
       icon: 'emojione:flag-for-belarus'
     }
   ]

   const switchLocale = (newLocale: LocaleCode) => {
     currentLocale.value = newLocale
   }

   return { currentLocale, locales, switchLocale }
}