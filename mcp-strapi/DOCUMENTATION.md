# MCP сервер Strapi v5 - Документация

## Обзор

MCP (Model Context Protocol) сервер для интеграции Strapi v5 с AI-ассистентами через Kilo Code. Сервер предоставляет 20+ инструментов для работы с контентом Strapi.

## Установка и настройка

### 1. Установка пакета

```bash
npm install strapi-mcp
```

### 2. Конфигурация окружения

Создайте файл `.env` в директории `mcp-strapi/`:

```env
# Strapi MCP Server Configuration
STRAPI_URL=http://localhost:1337

# Admin credentials (рекомендуется для полной функциональности)
# STRAPI_ADMIN_EMAIL=your_admin_email@example.com
# STRAPI_ADMIN_PASSWORD=your_admin_password

# Admin API Token (используется STRAPI_ADMIN_TOKEN из frontend/.env)
STRAPI_API_TOKEN=aa52df6b597314cb0e33f854bbfe89dd91d42e7b72a618ae5b93748352b27d68418dfbf00f5a46c61724a412e37ca7ce8354b9bf15411ee341e52ee7b9ad1ba47f605cf9b874cd2473e72b4c476883cb88c2e5d1f292c1df9e2ec6ff28493e6621efa87f371e2d14d79ec154bc10bc09694ee57586c0ecb8c73cb2674a7d5c41

# Development mode
STRAPI_DEV_MODE=true
```

### 3. Конфигурация Kilo Code MCP

Файл настроек: `C:/Users/Анатолий/AppData/Roaming/Code/User/globalStorage/kilocode.kilo-code/settings/mcp_settings.json`

```json
{
  "mcpServers": {
    "strapi": {
      "command": "npx.cmd",
      "args": ["strapi-mcp"],
      "env": {
        "STRAPI_URL": "http://localhost:1337",
        "STRAPI_API_TOKEN": "aa52df6b597314cb0e33f854bbfe89dd91d42e7b72a618ae5b93748352b27d68418dfbf00f5a46c61724a412e37ca7ce8354b9bf15411ee341e52ee7b9ad1ba47f605cf9b874cd2473e72b4c476883cb88c2e5d1f292c1df9e2ec6ff28493e6621efa87f371e2d14d79ec154bc10bc09694ee57586c0ecb8c73cb2674a7d5c41",
        "STRAPI_DEV_MODE": "true"
      },
      "disabled": false,
      "alwaysAllow": [
        "list_content_types",
        "get_entries",
        "get_entry",
        "get_content_type_schema"
      ],
      "disabledTools": []
    }
  }
}
```

## Доступные инструменты

### Основные инструменты CRUD

- `list_content_types` - Список всех content types
- `get_entries` - Получение записей с фильтрацией, пагинацией и сортировкой
- `get_entry` - Получение конкретной записи по ID
- `create_entry` - Создание новой записи
- `update_entry` - Обновление существующей записи
- `delete_entry` - Удаление записи

### Медиа-файлы

- `upload_media` - Загрузка медиа-файлов (до ~750KB)
- `upload_media_from_path` - Загрузка файлов с локального пути (до 10MB)

### Управление контентом

- `get_content_type_schema` - Получение схемы content type
- `connect_relation` - Связывание связанных записей
- `disconnect_relation` - Отвязывание связанных записей
- `publish_entry` - Публикация записи
- `unpublish_entry` - Снятие с публикации

### Компоненты

- `list_components` - Список всех компонентов
- `get_component_schema` - Получение схемы компонента
- `create_component` - Создание нового компонента
- `update_component` - Обновление компонента

### Content Types (требует admin прав)

- `create_content_type` - Создание нового content type
- `update_content_type` - Обновление content type
- `delete_content_type` - Удаление content type

## Примеры использования

### Получение списка content types

```javascript
use_mcp_tool(
  server_name: "strapi",
  tool_name: "list_content_types",
  arguments: {}
)
```

### Получение записей с фильтрацией

```javascript
use_mcp_tool(
  server_name: "strapi",
  tool_name: "get_entries",
  arguments: {
    "contentType": "api::product.product",
    "filters": {
      "price": {
        "$gt": 100
      }
    },
    "pagination": {
      "page": 1,
      "pageSize": 10
    },
    "sort": ["price:desc"]
  }
)
```

### Создание новой записи

```javascript
use_mcp_tool(
  server_name: "strapi",
  tool_name: "create_entry",
  arguments: {
    "contentType": "api::article.article",
    "data": {
      "title": "Новая статья",
      "content": "Содержание статьи",
      "publishedAt": "2026-03-22T08:00:00.000Z"
    }
  }
)
```

## Требования

1. **Запущенный Strapi инстанс** на `http://localhost:1337`
2. **API токен** с необходимыми разрешениями (используется `STRAPI_ADMIN_TOKEN` из `frontend/.env`)
3. **Node.js** версии 20.6.0 или выше

## Проблемы и решения

### 1. Ошибка подключения

**Симптомы**: "Cannot connect to Strapi instance: All connection tests failed"
**Решение**:

- Проверить, что Strapi запущен на `http://localhost:1337`
- Проверить правильность API токена
- Использовать admin credentials вместо API токена

### 2. Ошибка аутентификации

**Симптомы**: "Missing required authentication"
**Решение**:

- Добавить `STRAPI_ADMIN_EMAIL` и `STRAPI_ADMIN_PASSWORD` в `.env`
- Убедиться, что API токен имеет права администратора

### 3. Ошибка 404 при запросах

**Симптомы**: API возвращает 404 ошибку
**Решение**:

- Проверить правильность endpoint в Strapi v5
- Убедиться, что content type существует

## Интеграция с проектом

MCP сервер Strapi интегрирован с проектом через:

1. **Общие переменные окружения**: Используется `STRAPI_ADMIN_TOKEN` из `frontend/.env`
2. **Единая конфигурация**: URL Strapi синхронизирован между frontend и MCP сервером
3. **Автоматическое подключение**: Kilo Code автоматически подключает MCP сервер при запуске

## Рекомендации

1. **Для production**: Использовать admin credentials вместо API токена
2. **Для разработки**: Включить `STRAPI_DEV_MODE=true`
3. **Безопасность**: Хранить credentials в `.env` файле, добавленном в `.gitignore`
4. **Обновление**: Регулярно обновлять `strapi-mcp` до последней версии

## Ссылки

- [Официальная документация strapi-mcp](https://github.com/l33tdawg/strapi-mcp)
- [Документация Strapi v5](https://docs.strapi.io/)
- [Model Context Protocol](https://spec.modelcontextprotocol.io/)
