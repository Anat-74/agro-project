/**
 * Текущий buildId сборки (рантайм).
 *
 * Нужен клиентскому guard'у версии: установленная PWA может продолжать работать
 * СТАРЫМ бандлом (ОС восстанавливает живой процесс без запроса за HTML/JS, либо
 * service worker отдаёт закэшированный старый HTML на холодной сети). Guard
 * сравнивает свой buildId с этим и при расхождении перезагружает приложение.
 */
export default defineEventHandler((event) => {
  // Никогда не кэшировать: иначе guard прочитает устаревший id и не сработает
  setHeader(event, "cache-control", "no-store, max-age=0")
  return {
    buildId: String(useRuntimeConfig(event).app?.buildId ?? ""),
  }
})
