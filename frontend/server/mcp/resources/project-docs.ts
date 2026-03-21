import { defineMcpResource } from "@nuxtjs/mcp-toolkit";

export default defineMcpResource({
  name: "project-docs",
  description: "Документация проекта АгроМаркет",
  uri: "file://project-docs",
  content: `# Документация проекта АгроМаркет

## Общая информация
- **Название**: АгроМаркет - интернет-магазин сельскохозяйственной продукции
- **Версия**: 1.0.0
- **Статус**: В разработке (рефакторинг на Nuxt 4)

## Технологический стек

### Frontend
- **Фреймворк**: Nuxt 4.0.2
- **Язык**: TypeScript
- **UI**: Vue 3 Composition API
- **Стили**: SCSS с методологией BEM
- **Состояние**: Pinia с persisted state
- **PWA**: @vite-pwa/nuxt

### Backend
- **CMS**: Strapi v5
- **API**: REST + GraphQL (опционально)
- **База данных**: PostgreSQL (по умолчанию)

### Дополнительные модули
- **@nuxt/image**: Оптимизация изображений
- **@nuxtjs/strapi**: Интеграция с Strapi
- **@nuxtjs/seo**: SEO оптимизация
- **@nuxtjs/mcp-toolkit**: MCP интеграция
- **@nuxt/icon**: Управление иконками

## Структура проекта

### Frontend (frontend/)
\`\`\`
frontend/
├── app/
│   ├── components/          # Глобальные компоненты
│   ├── pages/              # Страницы приложения
│   ├── layouts/            # Макеты страниц
│   ├── assets/             # Статические ресурсы
│   ├── stores/             # Состояние Pinia
│   ├── composables/        # Композаблы Vue
│   └── locales/            # Локализация
├── server/
│   └── mcp/                # MCP инструменты и ресурсы
├── shared/
│   ├── types/              # Общие типы TypeScript
│   └── utils/              # Утилиты
└── public/                 # Публичные файлы
\`\`\`

### Backend (backend/)
\`\`\`
backend/
├── src/
│   ├── api/                # API endpoints Strapi
│   ├── components/         # Компоненты Strapi
│   └── extensions/         # Расширения Strapi
├── config/                 # Конфигурация Strapi
└── public/                 # Публичные файлы Strapi
\`\`\`

## MCP Интеграция

### Инструменты (Tools)
1. **test** - Тестовый инструмент для проверки MCP
2. **strapi-products** - Работа с товарами из Strapi
3. **cart-operations** - Операции с корзиной покупок
4. **analytics** - Аналитика и метрики проекта

### Промпты (Prompts)
1. **system-assistant** - Системный промпт для AI-ассистента

### Ресурсы (Resources)
1. **project-docs** - Эта документация

## Конфигурация MCP

### Nuxt Config
\`\`\`typescript
mcp: {
  autoDiscover: true,
  toolsDir: 'server/mcp/tools',
  promptsDir: 'server/mcp/prompts',
  resourcesDir: 'server/mcp/resources',
  security: {
    enabled: true,
    cors: { origin: ['http://localhost:3000'] }
  }
}
\`\`\`

### Runtime Config
\`\`\`typescript
runtimeConfig: {
  mcp: {
    enabled: process.env.MCP_ENABLED === 'true' || true,
    debug: process.env.MCP_DEBUG === 'true' || false,
  },
  public: {
    mcp: {
      endpoint: '/api/mcp',
      version: '1.0.0',
    },
  },
}
\`\`\`

## Разработка

### Запуск в development
\`\`\`bash
cd frontend
npm run dev
\`\`\`

### Сборка для production
\`\`\`bash
cd frontend
npm run build
npm run preview
\`\`\`

### Тестирование MCP
1. Запустите dev сервер
2. MCP endpoint будет доступен по адресу: \`http://localhost:3000/api/mcp\`
3. Используйте инструменты через MCP-клиент

## Контакты
- **Разработчик**: Команда АгроМаркет
- **Техподдержка**: support@agromarket.example.com
- **Документация**: https://docs.agromarket.example.com

## Лицензия
© 2024 АгроМаркет. Все права защищены.
`,
});
