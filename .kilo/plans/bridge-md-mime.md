# Telegram не открывает .md из моста — причина и фикс

Дата: 02.11.2026. Файл моста: `C:\kilo-bridje\bridge.js` (правки — только по согласованию).

## Статус: реализовано (03.11.2026)

- Резервная копия: `C:\kilo-bridje\bridge.js.bak-20261103-183155`.
- `sendAsFile()` переведён на прямой Bot API `sendDocument` с
  `Blob(..., { type: "text/plain" })`; `InputFile` больше не используется.
- `node --check bridge.js` — синтаксис OK.
- Для применения нужен **перезапуск моста** (`node bridge.js`).

## Причина

1. `sendAsFile()` (bridge.js ~200-224) шлёт ответ через grammY:
   `ctx.api.sendDocument(chat.id, new InputFile(buffer, "kilo_response.md"), {caption})`.
2. grammY **всегда** ставит файловой части `content-type: application/octet-stream`
   (`node_modules/grammy/out/core/payload.js`, строка 174) — MIME из имени файла не
   подставляется.
3. Telegram сохраняет документ как «бинарный» → встроенный просмотрщик на Android
   превью не строит (только «Открыть с помощью»). Desktop иногда угадывает по `.md` —
   отсюда «иногда открывается, иногда нет».
4. Дополнительный эффект «иногда»: `FILE_THRESHOLD = 4096` — короткие ответы уходят
   сообщением (файла нет), длинные — файлом `.md`. Маркер `#файл` форсирует файл.

## Фикс (вариант 1, рекомендуемый)

Отправлять документ с явным типом. Имя оставить `kilo_response.md`, MIME — `text/plain`
(самый совместимый для превью; `text/markdown` поддерживается клиентами неравномерно).

```js
// вместо ctx.api.sendDocument(...)
const form = new FormData();
form.append("chat_id", String(ctx.chat.id));
if (caption) form.append("caption", caption);
if (ctx.message) form.append("reply_to_message_id", String(ctx.message.message_id));
form.append("document", new Blob([fileBuffer], { type: "text/plain" }), filename);
const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
  method: "POST",
  body: form,
});
if (!res.ok) throw new Error(`sendDocument: ${res.status} ${await res.text()}`);
```

Node 26: `FormData`, `Blob`, `fetch` — глобальные, зависимостей не нужно.

## Альтернативы

- Переименовать вложение в `kilo_response.md.txt` — превью гарантировано, но расширение «не то».
- Слать ответ сообщением с `parse_mode` — лимит 4096 и экранирование MarkdownV2.

## Приёмка

Отправить в бота длинный ответ (> 4096) и `#файл`: документ `kilo_response.md` открывается
встроенным просмотрщиком Telegram на Android (текст виден, без «Открыть с помощью»).
