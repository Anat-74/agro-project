import { authTranslations } from '~/locales/auth'

interface AuthStoreUser {
  id: number
  documentId?: string
  username?: string
  email?: string
  provider?: string
  confirmed?: boolean
  blocked?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Карта известных ошибок Strapi → ключ локали */
const STRAPI_ERROR_MAP: Record<string, keyof typeof authTranslations.ru.errors> = {
  'Invalid identifier or password': 'invalidCredentials',
  'Email already taken': 'emailTaken',
  'Username already taken': 'usernameTaken',
  'password must be at least 6 characters': 'weakPassword',
  'Password must be at least 6 characters': 'weakPassword',
  'There is no user with this email address': 'emailNotFound',
  'No user found for this email': 'emailNotFound',
  'Invalid code': 'invalidCode',
  'Passwords do not match': 'passwordsDontMatch',
}

/** Достаёт locale из текущего маршрута или куки */
const getCurrentLocale = (): LocaleCode => {
  try {
    const route = useRoute()
    const lang = route.params.lang as string
    if (lang === 'be' || lang === 'ru') return lang
  } catch {
    // вне компонента route может быть недоступен
  }
  const cookie = useCookie<LocaleCode>('lang')
  return cookie.value || 'ru'
}

/** Маппит Strapi-ошибку → читаемое сообщение из локали */
const mapStrapiError = (rawMessage: string): string => {
  const locale = getCurrentLocale()
  const key = STRAPI_ERROR_MAP[rawMessage]
  if (key) {
    return authTranslations[locale]?.errors?.[key] || rawMessage
  }
  return rawMessage
}

export const useAuthStore = defineStore('auth', () => {
  const {
    login: strapiLogin,
    register: strapiRegister,
    logout: strapiLogout,
    fetchUser: strapiFetchUser,
    forgotPassword: strapiForgotPassword,
    resetPassword: strapiResetPassword,
  } = useStrapiAuth()

  const strapiToken = useStrapiToken()

  const user = ref<AuthStoreUser | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string>>({})

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  const clearError = () => {
    error.value = null
    fieldErrors.value = {}
  }

  const init = async () => {
    try {
      loading.value = true
      token.value = strapiToken.value || null

      if (token.value) {
        const userRef = await strapiFetchUser()
        user.value = userRef.value || null
      }
    } catch (e) {
      console.error('Auth init error:', e)
      token.value = null
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const login = async (identifier: string, password: string) => {
    clearError()
    loading.value = true
    try {
      const response: any = await strapiLogin({ identifier, password })
      user.value = response?.user?.value || null
      token.value = response?.jwt || null
    } catch (e: any) {
      const raw = e?.error?.message || e?.message || ''
      error.value = mapStrapiError(raw)
      throw e
    } finally {
      loading.value = false
    }
  }

  const register = async (username: string, email: string, password: string) => {
    clearError()
    loading.value = true
    try {
      const response: any = await strapiRegister({ username, email, password })
      user.value = response?.user?.value || null
      token.value = response?.jwt || null
    } catch (e: any) {
      const raw = e?.error?.message || e?.message || ''
      error.value = mapStrapiError(raw)

      // Field-level: парсим validation errors из details
      const details = e?.response?.data?.error?.details
      if (details?.errors) {
        for (const err of details.errors) {
          const path = err.path?.[0]
          if (path) {
            fieldErrors.value[path] = err.message
          }
        }
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const forgotPassword = async (email: string) => {
    clearError()
    loading.value = true
    try {
      await strapiForgotPassword({ email })
    } catch (e: any) {
      const raw = e?.error?.message || e?.message || ''
      error.value = mapStrapiError(raw)
      throw e
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (code: string, password: string, passwordConfirmation: string) => {
    clearError()
    loading.value = true
    try {
      const response: any = await strapiResetPassword({ code, password, passwordConfirmation })
      user.value = response?.user?.value || null
      token.value = response?.jwt || null
    } catch (e: any) {
      const raw = e?.error?.message || e?.message || ''
      error.value = mapStrapiError(raw)
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    strapiLogout()
    user.value = null
    token.value = null
    error.value = null
    fieldErrors.value = {}
  }

  return {
    user,
    token,
    loading,
    error,
    fieldErrors,
    isAuthenticated,
    init,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    clearError,
  }
})
