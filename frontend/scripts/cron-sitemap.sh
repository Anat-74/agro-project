#!/bin/bash

# Путь к директории проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/logs/sitemap-cron.log"
ENV_FILE="$PROJECT_DIR/.env"

# Создаем директорию для логов, если она не существует
mkdir -p "$PROJECT_DIR/logs"

# Функция логирования
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log "=== Начало выполнения cron-задачи для генерации sitemap ==="

# Проверяем наличие .env файла
if [ ! -f "$ENV_FILE" ]; then
    log "ERROR: Файл .env не найден в $ENV_FILE"
    exit 1
fi

log "Файл .env найден"

# Загружаем переменные из .env файла
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Переходим в директорию проекта
cd "$PROJECT_DIR"

# Выполняем генерацию sitemap
log "Запуск генерации sitemap..."
npm run generate-sitemap

if [ $? -eq 0 ]; then
    log "SUCCESS: Sitemap успешно сгенерирован"
else
    log "ERROR: Ошибка при генерации sitemap"
    exit 1
fi

log "=== Завершение выполнения cron-задачи ==="