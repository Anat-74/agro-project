// Диагностика sticky/скролла с телефона: открыть любую страницу с ?debug=sticky.
// Показывает в углу: scrollY, высоту документа, visual viewport (offsetTop/height/scale)
// и позиции крошек/тулбара/пагинации/шапки. Ничего не делает без параметра.
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const route = useRoute()
  if (route.query.debug !== "sticky") return

  const pre = document.createElement("pre")
  pre.style.cssText = [
    "position:fixed",
    "top:4px",
    "left:4px",
    "z-index:99999",
    "margin:0",
    "padding:6px 8px",
    "background:rgba(0,0,0,.85)",
    "color:#0f0",
    "font:11px/1.35 ui-monospace,monospace",
    "white-space:pre",
    "pointer-events:none",
    "border-radius:6px",
  ].join(";")
  document.body.appendChild(pre)

  const rect = (selector: string) => {
    const el = document.querySelector(selector)
    if (!el) return "—"
    const r = el.getBoundingClientRect()
    return `${Math.round(r.top)}…${Math.round(r.bottom)}`
  }

  const update = () => {
    const vv = window.visualViewport
    pre.textContent = [
      `scrollY ${Math.round(window.scrollY)}  docH ${document.documentElement.scrollHeight}`,
      `vv top ${Math.round(vv?.offsetTop ?? 0)}  h ${Math.round(vv?.height ?? 0)}  scale ${vv?.scale ?? 1}`,
      `html ovx ${getComputedStyle(document.documentElement).overflowX}`,
      `header ${rect(".header")}`,
      `crumbs ${rect(".products-page__header")}`,
      `toolbar ${rect(".products-page__container-top")}`,
      `pagination ${rect(".products-page__pagination")}`,
      `body ov ${getComputedStyle(document.body).overflowY}`,
    ].join("\n")
  }

  update()
  window.addEventListener("scroll", update, { passive: true })
  window.addEventListener("resize", update)
  window.visualViewport?.addEventListener("scroll", update)
  window.visualViewport?.addEventListener("resize", update)
})
