import type { LocaleCode } from "@/types/types"

export const useLocale = () => {
   const route = useRoute()
   const router = useRouter()
   
   const langCookie = useCookie<string>('lang', {
     maxAge: 30 * 24 * 60 * 60, // 30 дней
     sameSite: 'lax'
   })

const _currentLocale = ref<LocaleCode>(
  ((route.params.lang as string) || langCookie.value || 'ru') as LocaleCode
)

   // Computed для реактивного доступа
   const currentLocale = computed({
     get: () => _currentLocale.value,
     set: (value: LocaleCode) => {
       _currentLocale.value = value
       langCookie.value = value
       if (route.params.lang !== value) {
         router.replace({
           params: { ...route.params, lang: value },
           query: route.query
         })
       }
     }
   })

   watch(() => route.params.lang, (newVal) => {
     if (newVal && newVal !== currentLocale.value) {
       const validLocales: LocaleCode[] = ['ru', 'en', 'be']
       currentLocale.value = validLocales.includes(newVal as LocaleCode) 
         ? newVal as LocaleCode 
         : 'ru'
     }
   })

   const locales = [
     { 
       code: 'ru', 
       icon: 'emojione:flag-for-russia'
     },
     { 
       code: 'en', 
       icon: 'emojione:flag-for-united-kingdom'
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