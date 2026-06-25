export default defineNuxtRouteMiddleware(async (to) => {
  // Не проверяем на страницах входа/регистрации
  if (to.path.includes('/auth/login') || to.path.includes('/auth/register') || to.path.includes('/auth/forgot-password') || to.path.includes('/auth/reset-password') || to.path.includes('/auth/')) {
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
    return navigateTo(`/${lang}/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
