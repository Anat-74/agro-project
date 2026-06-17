export const useAuth = () => {
  const authStore = useAuthStore()
  const route = useRoute()
  const router = useRouter()

  const isAuthenticated = computed(() => authStore.isAuthenticated)

  const redirectToLogin = (redirect?: string) => {
    const lang = route.params.lang || 'ru'
    const target = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
    router.push(`/${lang}${target}`)
  }

  const requireAuth = () => {
    if (!authStore.isAuthenticated) {
      redirectToLogin(route.fullPath)
      return false
    }
    return true
  }

  // Инициализация при первом вызове
  if (!authStore.isAuthenticated && !authStore.loading) {
    authStore.init()
  }

  return {
    ...authStore,
    isAuthenticated,
    redirectToLogin,
    requireAuth,
  }
}
