# Kilo Bridge — Telegram Bot Integration

## Общая архитектура

**Файл:** `C:\kilo-bridje\bridge.js`
**Библиотека:** [grammy](https://grammy.dev/) (Telegram Bot API для Node.js)
**Команда для Kilo:** `kilo run --auto --session <ID> '<text>'` через `child_process.spawn`
**Таймаут:** 80с (`spawn` с `timeout` — Node.js поддерживает, шлёт SIGTERM)

### Поток данных:
Telegram → bridge.js → spawn bash → `kilo run --auto --session <ID>` → stdout → bridge.js → Telegram

---

## Проблема 1: /cancel и /kill не работают, пока Kilo занят

**Симптом:** handler блокируется на 80+ секунд через `await runKiloWithTimeout()`. Ни одна команда (`/cancel`, `/kill`, `/status`) не обрабатывается, потому что grammy обрабатывает сообщения **последовательно**.

**Корень:** `bot.on("message:text", async (ctx) => { await runKiloWithTimeout(...) })` — `await` блокирует очередь бота на всё время выполнения.

**Попытка решения v1 (background):** Запуск Kilo без `await`, в фоне, результат через колбэк. **Не сработало** — сообщения перестали доходить до агента, таймаут срабатывал постоянно.

**Попытка решения v2 (manual timeout):** Ручной `setTimeout` + `settled` флаг внутри Promise. **Не сработало** — то же самое, сообщения не доходили.

---

## Проблема 2: Изменение Promise-логики ломает доставку сообщений

**Симптом:** Любое изменение Promise (добавление `isResolved`, `settled`, ручного `clearTimeout`) приводит к тому, что сообщения перестают доходить до агента. Даже "как связь?" уходит в таймаут.

**Корень (предположение):** Изменение Promise-логики каким-то образом нарушает поток `stdout`/`stderr` из spawn или событие `close`. Оригинальный `spawn({ timeout })` с SIGTERM — рабочий механизм, его модификация ломает доставку.

---

## Что нужно реализовать

1. `/cancel` убивает spawn-процесс Kilo и сбрасывает `isProcessing`
2. `/kill` останавливает бота (`process.exit(0)`)
3. Пользователь может отправить новое сообщение не дожидаясь ответа на предыдущее
4. Механизм НЕ ломает доставку сообщений агенту

---

## Возможные решения (нужен доступ к интернету и документации grammy)

### A) Grammy middleware / bot.filter()
Использовать `bot.use()` или `bot.filter()` для обработки команд без блокировки основного handler-а.
[https://grammy.dev/guide/filter-queries](https://grammy.dev/guide/filter-queries)

### B) Worker thread для Kilo
Запускать `kilo run` в отдельном worker/child process без `await`. Результат через колбэк или EventEmitter.
```javascript
const { Worker } = require('worker_threads');
// или emitter.once('result', sendToTelegram)
```

### C) EventEmitter
Kilo запускается без `await`, результат приходит через событие. `/cancel` эмитит сигнал на убийство процесса.
```javascript
const { EventEmitter } = require('events');
const bus = new EventEmitter();
bus.once('kilo-done', (data) => ctx.reply(data));
bus.emit('kilo-cancel'); // в /cancel
```

### D) Два отдельных процесса
grammy-бот и Kilo-runner работают в разных процессах, общаются через IPC или файловую систему.

### E) Concurrent middleware
Настроить grammy на конкурентную обработку апдейтов.

---

## Файлы

- `C:\kilo-bridje\bridge.js` — основной код бота (текущая рабочая версия)
- `C:\kilo-bridje\kilo-bridge.log` — лог бота
- `.kilo\plans\kilo-bridge.md` — этот документ
- `.kilo\plans\deploy-automation-rules.md` — правила автоматизации деплоя

## Переменные окружения / Настройки

| Переменная | Значение | Назначение |
|-----------|----------|------------|
| `BOT_TOKEN` | `8878753478:AAGgUr8X6AA-lcZCN0JOeWVHvYiASA2kIA4` | Токен Telegram бота |
| `SESSION_ID` | `ses_09ef22fd7ffe9AFhQ08Ql72spa` | ID сессии Kilo |
| `PROJECT_PATH` | `C:/agro-project` | Путь к проекту |
| `KILO_TIMEOUT` | `80000` (80с) | Таймаут ожидания ответа |

## Команды бота

| Команда | Назначение | Статус |
|---------|-----------|--------|
| `/start` | Показать справку | ✅ |
| `/status` | Статус (занят/свободен) | ✅ |
| `/cancel` | Отменить команду (только флаг, не убивает процесс) | ⚠️ Не работает пока handler висит |
| `/kill` | Остановить бота | ⚠️ Не работает пока handler висит |
