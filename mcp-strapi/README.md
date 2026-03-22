# Strapi MCP Server

MCP-сервер для интеграции Strapi v5 с Model Context Protocol.

## Установка и настройка

### 1. Установка зависимостей

```bash
npm install strapi-mcp
```

### 2. Конфигурация

Создайте файл `.env` в корневой директории:

```env
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_here
STRAPI_DEV_MODE=true
```

### 3. Настройка MCP в Kilo Code

MCP settings файл обновлен автоматически. Конфигурация включает:

```json
{
  "strapi": {
    "command": "npx",
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
```

## Доступные инструменты

MCP-сервер предоставляет 20+ инструментов для работы с Strapi:

### Основные инструменты

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

1. **Запущенный Strapi инстанс** на `http://localhost:1337` (или другом указанном URL)
2. **API токен** с необходимыми разрешениями
3. **Node.js** версии 20.6.0 или выше

## Безопасность

- API токен хранится в `.env` файле, который добавлен в `.gitignore`
- В production рекомендуется использовать admin credentials вместо API токена
- Режим разработки (`STRAPI_DEV_MODE=true`) включает дополнительные функции

## Устранение неполадок

### Ошибка подключения

```
Cannot connect to Strapi instance: Connection refused
```

Убедитесь, что Strapi запущен и доступен по указанному URL.

### Ошибка аутентификации

```
Authentication failed. Check your API token or admin credentials.
```

Проверьте правильность API токена и его разрешения.

### Context window overflow

При загрузке больших файлов используйте `upload_media_from_path` вместо `upload_media`.

## Дополнительная информация

- [Официальная документация strapi-mcp](https://github.com/l33tdawg/strapi-mcp)
- [Документация Strapi v5](https://docs.strapi.io)
- [Model Context Protocol](https://spec.modelcontextprotocol.io)
