interface AuthStoreUser {
  id: number
  username?: string
  email?: string
  provider?: string
  confirmed?: boolean
  blocked?: boolean
  createdAt?: string
  updatedAt?: string
}

export const useAuthStore = defineStore('auth', () => {
  const {
    login: strapiLogin,
    register: strapiRegister,
    logout: strapiLogout,
    fetchUser: strapiFetchUser,
  } = useStrapiAuth()

  const strapiToken = useStrapiToken()

  const user = ref<AuthStoreUser | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

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
    error.value = null
    loading.value = true
    try {
      const response: any = await strapiLogin({ identifier, password })
      user.value = response?.user?.value || null
      token.value = response?.jwt || null
    } catch (e: any) {
      const message = e?.response?.data?.error?.message || e?.message || 'Ошибка входа'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  const register = async (username: string, email: string, password: string) => {
    error.value = null
    loading.value = true
    try {
      const response: any = await strapiRegister({ username, email, password })
      user.value = response?.user?.value || null
      token.value = response?.jwt || null
    } catch (e: any) {
      const message = e?.response?.data?.error?.message || e?.message || 'Ошибка регистрации'
      error.value = message
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
  }

  const clearError = () => {
    error.value = null
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    init,
    login,
    register,
    logout,
    clearError,
  }
})
