# Руководство по интеграции Nuxt MCP Server

## Что такое Nuxt MCP Server

Nuxt MCP (Model Context Protocol) - это стандартизированный протокол, который позволяет AI-ассистентам получать доступ к внешним источникам данных инструментам. Nuxt предоставляет MCP-сервер, который позволяет AI-ассистентам (таким как Claude Code, Cursor, Windsurf) получать доступ к документации, блогам и руководствам по развертыванию напрямую.

## Ресурсы, предоставляемые Nuxt MCP Server

- **resource://nuxt-com/documentation-pages**: Просмотр всех доступных страниц документации (по умолчанию v4.x)
- **resource://nuxt-com/blog-posts**: Просмотр всех постов в блоге Nuxt, включая релизы и учебники
- **resource://nuxt-com/deploy-providers**: Просмотр всех провайдеров развертывания и хостинг-платформ

## Инструменты, предоставляемые Nuxt MCP Server

### Документация

- **list_documentation_pages**: Список всех доступных страниц документации Nuxt с их категориями и базовой информацией
- **get_documentation_page**: Получение содержимого и деталей страницы документации по пути
- **get_getting_started_guide**: Получение руководства по началу работы для определенной версии Nuxt

### Блог

- **list_blog_posts**: Список всех постов в блоге Nuxt с метаданными, включая даты, категории и теги
- **get_blog_post**: Получение содержимого и деталей поста в блоге по пути

### Развертывание

- **list_deploy_providers**: Список всех провайдеров развертывания и хостинг-платформ для приложений Nuxt
- **get_deploy_provider**: Получение деталей и инструкций по развертыванию для определенного провайдера

## Настройка для различных AI-ассистентов

### VS Code (с GitHub Copilot)

1. Убедитесь, что установлены расширения:
   - [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
   - [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat)

2. Конфигурация уже создана в `.vscode/mcp.json`:
   ```json
   {
     "servers": {
       "nuxt": {
         "type": "http",
         "url": "https://nuxt.com/mcp"
       }
     }
   }
   ```

### Cursor

1. Конфигурация уже создана в `.cursor/mcp.json`
2. Или вручную в настройках Cursor:
   - Откройте Cursor → Settings → Tools & MCP
   - Добавьте конфигурацию Nuxt MCP Server

### Claude Code

```bash
claude mcp add --transport http nuxt-remote https://nuxt.com/mcp
```

### Claude Desktop

1. Откройте Claude Desktop → Settings → Developer
2. Нажмите "Edit Config"
3. Добавьте в `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "nuxt": {
         "command": "npx",
         "args": ["mcp-remote", "https://nuxt.com/mcp"]
       }
     }
   }
   ```

### Windsurf

1. Откройте Windsurf → Settings → Windsurf Settings → Cascade
2. Нажмите "Manage MCPs" → "View raw config"
3. Добавьте в `.codeium/windsurf/mcp_config.json`:
   ```json
   {
     "mcpServers": {
       "nuxt": {
         "type": "http",
         "url": "https://nuxt.com/mcp"
       }
     }
   }
   ```

### GitHub Copilot Agent

1. Перейдите в репозиторий GitHub → Settings → Code & automation → Copilot → Coding agent
2. В разделе "MCP configuration" добавьте:
   ```json
   {
     "mcpServers": {
       "nuxt": {
         "type": "http",
         "url": "https://nuxt.com/mcp",
         "tools": ["*"]
       }
     }
   }
   ```

## Примеры использования

После настройки можно задавать AI-ассистенту вопросы вроде:

- "List all available Nuxt documentation pages"
- "Get the introduction documentation"
- "What's the difference between v3 and v4?"
- "How do I deploy to Vercel?"
- "Show me the latest blog posts"
- "Help me migrate from Nuxt 3 to Nuxt 4"
- "Search documentation about composables"
- "Find deployment guides for Cloudflare"

## Конфигурация для Kilo Code

Конфигурация для Kilo Code уже настроена в `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "nuxt-docs": {
      "command": "npx",
      "args": ["mcp-remote", "https://nuxt.com/mcp"]
    }
  }
}
```

## Проверка работы

Для проверки работы MCP-сервера можно использовать команды:

```bash
# Проверить доступность сервера
curl -X POST https://nuxt.com/mcp/tools/list
```

## Устранение неполадок

1. **Сервер недоступен**: Проверьте интернет-соединение
2. **Ошибки аутентификации**: Nuxt MCP Server не требует аутентификации
3. **Ограничения частоты запросов**: Добавьте задержки между запросами
4. **Проблемы с конфигурацией**: Проверьте синтаксис JSON-файлов
