/**
 * Обновление данных при возврате приложения на передний план (client-only).
 *
 * SPA/PWA при возврате из фона НЕ перезапрашивает данные сам — показывает
 * загруженное ранее. Из-за этого после паузы пользователь видел «старые данные»
 * (ручная перезагрузка их обновляла, т.к. запускала запросы заново).
 * Если приложение «спало» дольше минуты — обновляем async-данные хуком Nuxt
 * `app:data:refresh` (то же, что вызывает refreshNuxtData()).
 */
export default defineNuxtPlugin((nuxtApp) => {
  const STALE_AFTER = 60_000 // дольше минуты в фоне → считаем данные устаревшими
  let hiddenAt = 0

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now()
      return
    }
    if (hiddenAt && Date.now() - hiddenAt > STALE_AFTER) {
      hiddenAt = 0
      nuxtApp.hooks
        .callHookParallel("app:data:refresh", undefined)
        .catch(() => {})
    }
  })
})
