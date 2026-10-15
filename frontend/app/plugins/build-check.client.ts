/**
 * Защита от «устаревшего» состояния при возврате в приложение (client-only).
 *
 * 1) ВЕРСИЯ БАНДЛА. После деплоя PWA может продолжать работать СТАРЫМ бандлом
 *    (resume живого процесса из памяти либо старый HTML, отданный service worker'ом).
 *    На старте / при возврате на передний план / раз в 10 минут сравниваем свой
 *    buildId с серверным; при расхождении — location.reload() (коулдаун 60 с).
 *
 * 2) СВЕЖЕСТЬ ДАННЫХ. SPA при возврате сам данные НЕ перезапрашивает — показывает
 *    загруженное ранее. Если приложение «спало» дольше минуты, обновляем async-данные
 *    хуком Nuxt `app:data:refresh`.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const running = String(useRuntimeConfig().app?.buildId ?? "")
  if (!running) return

  const RELOAD_KEY = "build-guard:reloaded-at"
  const CHECK_INTERVAL = 10 * 60_000
  const RELOAD_COOLDOWN = 60_000

  let checking = false

  const check = async () => {
    if (checking || document.visibilityState !== "visible") return
    checking = true
    try {
      const res = await $fetch<{ buildId?: string }>("/api/build-id")
      const server = String(res?.buildId ?? "")
      if (!server || server === running) return

      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
      if (Date.now() - last < RELOAD_COOLDOWN) return

      sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
      location.reload()
    } catch {
      // сети нет — проверим при следующем возврате/интервале
    } finally {
      checking = false
    }
  }

  check()

  // Возврат приложения на передний план (resume PWA). SPA сам данные НЕ
  // перезапрашивает — показывает загруженное в прошлый раз (это и есть «старые
  // данные», которые «лечила» ручная перезагрузка). Если приложение спало дольше
  // минуты — обновляем async-данные хуком Nuxt + проверяем версию бандла.
  let hiddenAt = 0
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now()
      return
    }
    if (hiddenAt && Date.now() - hiddenAt > 60_000) {
      hiddenAt = 0
      nuxtApp.hooks
        .callHookParallel("app:data:refresh", undefined)
        .catch(() => {})
    }
    check()
  })

  setInterval(() => {
    if (document.visibilityState === "visible") check()
  }, CHECK_INTERVAL)
})
