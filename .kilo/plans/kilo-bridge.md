# Kilo Bridge — Telegram Bot Integration

## Общая архитектура

**Файл:** `C:\kilo-bridje\bridge.js`
**Библиотека:** [grammy](https://grammy.dev/) (Telegram Bot API для Node.js)
**Команда для Kilo:** `kilo run --auto --session <ID> '<text>'` через `child_process.spawn`
**Таймаут:** 80с (`spawn` с `timeout` — Node.js поддерживает, шлёт SIGTERM)

### Поток данных:
Telegram → bridge.js → spawn bash → `kilo run --auto --session <ID>` → stdout → bridge.js → Telegram

---

## Статус на 16.07.2026

✅ **Все команды работают стабильно:**
- `/start` — справка
- `/status` — статус (занят/свободен)
- `/cancel` — отмена текущей команды (сбрасывает `isProcessing`, убивает spawn-процесс)
- `/kill` — остановка бота (`process.exit(0)`)

**Ключевые фиксы:**
- Механизм конкурентной обработки команд (больше нет блокировки handler-a)
- `/cancel` и `/kill` корректно обрабатываются даже во время выполнения длительных операций
- Доставка сообщений агенту не ломается

---

## Настройки

| Переменная | Значение | Назначение |
|-----------|----------|------------|
| `BOT_TOKEN` | `8878753478:AAGgUr8X6AA-lcZCN0JOeWVHvYiASA2kIA4` | Токен Telegram бота |
| `SESSION_ID` | `ses_093998150ffefRKx8jIEVH6B50` | ID сессии Kilo |
| `PROJECT_PATH` | `C:/agro-project` | Путь к проекту |
| `KILO_TIMEOUT` | `80000` (80с) | Таймаут ожидания ответа |

---

## Команды бота

| Команда | Назначение | Статус |
|---------|-----------|--------|
| `/start` | Показать справку | ✅ |
| `/status` | Статус (занят/свободен) | ✅ |
| `/cancel` | Отменить текущую команду | ✅ Работает |
| `/kill` | Остановить бота | ✅ Работает |

---

## Файлы

- `C:\kilo-bridje\bridge.js` — основной код бота
- `C:\kilo-bridje\kilo-bridge.log` — лог бота
- `.kilo\plans\kilo-bridge.md` — этот документ
- `.kilo\plans\deploy-automation-rules.md` — правила автоматизации деплоя
