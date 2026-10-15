/**
 * Guard версии приложения (client-only).
 *
 * Почему нужен: после деплоя установленная PWA может продолжать работать СТАРЫМ
 * бандлом — ОС восстанавливает живой процесс (resume из памяти) без запроса за
 * HTML/JS, либо service worker отдаёт закэшированный старый HTML на холодной
 * сети. Ручной reload поднимает свежий бандл, но пользователь об этом не знает.
 *
 * Здесь: на старте, при возврате приложения на передний план и раз в 10 минут
 * сравниваем свой buildId с серверным. Если разошлись — перезагружаемся.
 * Не чаще раза в минуту (анти-петля, если сервер отдаёт неконсистентный id).
 */
export default defineNuxtPlugin(() => {
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
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check()
  })
  setInterval(() => {
    if (document.visibilityState === "visible") check()
  }, CHECK_INTERVAL)
})
