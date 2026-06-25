export default defineNuxtRouteMiddleware(async (to) => {
  // Не проверяем на страницах входа/регистрации
  if (to.path.includes('/login') || to.path.includes('/register') || to.path.includes('/forgot-password') || to.path.includes('/reset-password')) {
    return
  }

  const authStore = useAuthStore()

  // Попытка восстановить сессию
  if (!authStore.isAuthenticated && !authStore.loading) {
    await authStore.init()
  }

  // Если всё ещё не авторизован — редирект на логин
  if (!authStore.isAuthenticated) {
    const lang = to.params.lang || 'ru'
    return navigateTo(`/${lang}/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
