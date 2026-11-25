// Запрет индексации для технических/стендовых адресов.
// Реальные домены индексируются как обычно, а превью на *.ihb.by, *.netlify.app
// и localhost не попадают в поисковики (иначе при переезде на домен получаем дубли).
const NOINDEX_SUFFIXES = [".ihb.by", ".netlify.app", ".netlify.com"]

export default defineEventHandler((event) => {
  const host = (getRequestHost(event) || "").toLowerCase()
  const isLocal = host === "localhost" || host.startsWith("127.0.0.1") || host.startsWith("[::1]")

  if (isLocal || NOINDEX_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    setHeader(event, "X-Robots-Tag", "noindex, nofollow")
  }
})
