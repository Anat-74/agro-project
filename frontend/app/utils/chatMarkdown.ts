// Безопасный мини-Markdown для ответов чат-ассистента.
// Сначала экранируем HTML, затем добавляем только «свои» теги — вставка через v-html безопасна.

export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

// Инлайновая разметка (применяется к уже экранированному тексту):
// **bold**, __bold__, *italic*, `code`, [ссылка](url)
export const renderInline = (text: string): string =>
  text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )

// Блочная разметка: абзацы, списки, заголовки (как <strong>).
// Вход уже экранирован escapeHtml.
export const renderMarkdown = (escaped: string): string => {
  const lines = escaped.split("\n")
  let html = ""
  let listTag: "ul" | "ol" | null = null
  const closeList = () => {
    if (listTag) {
      html += `</${listTag}>`
      listTag = null
    }
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "")
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/)
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    const heading = line.match(/^\s*#{1,6}\s+(.+)$/)

    if (bullet || ordered) {
      const tag = bullet ? "ul" : "ol"
      if (listTag !== tag) {
        closeList()
        html += `<${tag}>`
        listTag = tag
      }
      html += `<li>${renderInline((bullet || ordered)![1])}</li>`
    } else if (heading) {
      closeList()
      html += `<p><strong>${renderInline(heading[1])}</strong></p>`
    } else if (line.trim() === "") {
      closeList()
    } else {
      closeList()
      html += `<p>${renderInline(line)}</p>`
    }
  }

  closeList()
  return html
}
