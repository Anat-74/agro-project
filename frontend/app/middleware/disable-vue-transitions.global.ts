export default defineNuxtRouteMiddleware((to, from) => {
  // Vue transitions отключаем, когда навигация задействует страницу с
  // включённым View Transitions (VT применяется и при входе — toTypes,
  // и при выходе — fromTypes). Только в браузерах, поддерживающих VT API.
  // SSR-страницы (без VT) продолжают использовать Vue transitions.
  if (import.meta.server || !document.startViewTransition) return

  if (to.meta.viewTransition || from.meta.viewTransition) {
    to.meta.pageTransition = false
    to.meta.layoutTransition = false
  }
})
