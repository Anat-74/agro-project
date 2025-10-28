# Анализ проблемы с генерацией sitemap.xml

## Введение

В ходе работы с проектом возникла проблема с автоматической генерацией sitemap.xml через cron-задачу на хостинге. При попытке выполнить POST-запрос к эндпоинту `/api/admin/generate-sitemap` с использованием curl возвращается ошибка 403 Forbidden. Техническая поддержка хостинга предложила альтернативное решение с использованием встроенного cron-планировщика node-cron.

## Текущая архитектура

### 1. API-эндпоинт для генерации sitemap

Файл: `frontend/server/api/admin/generate-sitemap.post.ts`

```typescript
import { generateSitemap } from '../../../scripts/generate-sitemap'
import { createError, getHeader } from 'h3'

interface SitemapResponse {
  success: boolean
  message: string
  timestamp: string
}

export default defineEventHandler(async (event): Promise<SitemapResponse> => {
  // Проверка токена безопасности
  const token = getHeader(event, 'X-Sitemap-Token')
  const expectedToken = process.env.SITEMAP_GENERATION_TOKEN

  if (!token || token !== expectedToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid or missing sitemap token'
    })
  }

  try {
    // Вызываем функцию генерации карты сайта
    await generateSitemap()
    
    // Возвращаем успешный ответ
    return {
      success: true,
      message: 'Sitemap generated successfully',
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    // Возвращаем ошибку
    throw createError({
      statusCode: 500,
      statusMessage: `Sitemap generation failed: ${error.message || 'Unknown error'}`
    })
  }
})
```

### 2. Скрипт генерации sitemap

Файл: `frontend/scripts/generate-sitemap.ts`

```typescript
// @ts-ignore
import { writeFileSync, existsSync } from 'fs'
import { $fetch } from 'ofetch'
import { resolve } from 'path'

async function loadEnv() {
  try {
    const dotenv = await import('dotenv')
    const envPath = resolve(process.cwd(), '.env')
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath })
    } else {
      console.warn('.env file not found, using default values')
    }
  } catch (error) {
    console.warn('dotenv not found, using default values')
  }
}

interface SitemapUrl {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: string
  images?: Array<{ loc: string }>
}

export async function generateSitemap() {
  // Загружаем переменные окружения
  await loadEnv()
  
  const siteUrl = process.env.SITE_URL
  const strapiUrl = process.env.NUXT_PUBLIC_STRAPI_URL
  const strapiToken = process.env.NUXT_STRAPI_TOKEN
  
  console.debug('Strapi URL:', strapiUrl)

  let urls: SitemapUrl[] = []
  
  try {
    // Преобразуем данные Strapi в формат sitemap
    const langs = ['ru', 'en', 'be']
    const mainLocale = 'ru'; // Основная локаль, где есть все данные
    
    // Получаем данные напрямую из API Strapi (более надёжно, чем Nuxt API)
    
    try {
      // Добавляем статические страницы
      for (const lang of langs) {
        urls.push({ loc: `/${lang}/about`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/services`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/contacts`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/cartshopping`, lastmod: new Date().toISOString() })
      }
      
      // Fetch data only for the main locale where data exists
      // Use the correct populate structure as per Strapi relationships
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        $fetch(`${strapiUrl}/api/categories?populate=image&locale=${mainLocale}`, {
          headers: { Authorization: `Bearer ${strapiToken}` }
        }).catch(() => ({ data: [] })),
        $fetch(`${strapiUrl}/api/subcategories?populate=products&populate=category&populate=products.image&populate=image&locale=${mainLocale}`, {
          headers: { Authorization: `Bearer ${strapiToken}` }
        }).catch(() => ({ data: [] }))
      ])
      
      console.debug('Categories data for main locale', mainLocale, ':', categoriesRes.data?.length);
      console.debug('Subcategories data for main locale', mainLocale, ':', subcategoriesRes.data?.length);
      console.debug('Subcategories data with products:', JSON.stringify(subcategoriesRes.data?.[0], null, 2)), null, 2));
      
      // Create a map of category ID to subcategories for easier lookup
      const categorySubcategoriesMap: Record<string, any[]> = {};
      if (subcategoriesRes.data) {
        for (const sub of subcategoriesRes.data) {
          if (sub.category) {
            const categoryId = sub.category.id;
            if (!categorySubcategoriesMap[categoryId]) {
              categorySubcategoriesMap[categoryId] = [];
            }
            categorySubcategoriesMap[categoryId].push(sub);
          }
        }
      }
      
      // Add categories and subcategories for all locales
      if (categoriesRes.data) {
        for (const cat of categoriesRes.data) {
          for (const lang of langs) {
            // Extract images from category data
            // The image field is an array, so we need to map all images
            const catImages = cat.image && Array.isArray(cat.image)
              ? cat.image.map((img: any) => ({
                  loc: `${strapiUrl}${img.url}`
                }))
              : []
            urls.push({
              loc: `/${lang}/${cat.slug}`,
              lastmod: cat.updatedAt || cat.createdAt,
              images: catImages
            })
            
            // Add subcategories for this category
            const subcategoriesForCat = categorySubcategoriesMap[cat.id] || [];
            for (const sub of subcategoriesForCat) {
              // Extract images from subcategory data
              // The image field is an array, so we need to map all images
              const subImages = sub.image && Array.isArray(sub.image)
                ? sub.image.map((img: any) => ({
                    loc: `${strapiUrl}${img.url}`
                  }))
                : []
              urls.push({
                loc: `/${lang}/${cat.slug}/${sub.slug}`,
                lastmod: sub.updatedAt || sub.createdAt,
                images: subImages
              })
            }
          }
        }
      }
      
      // Add products for all locales using subcategory data
      if (subcategoriesRes.data) {
        for (const sub of subcategoriesRes.data) {
          if (sub.products && Array.isArray(sub.products)) {
            for (const prod of sub.products) {
              if (sub.category) {
                for (const lang of langs) {
                  // Извлекаем изображения из данных продукта
                  // Поле изображения - это массив, поэтому нам нужно отобразить все изображения
                  const images = prod.image && Array.isArray(prod.image)
                    ? prod.image.map((img: any) => ({
                        loc: `${strapiUrl}${img.url}`
                      }))
                    : []
                    urls.push({
                    loc: `/${lang}/${sub.category.slug}/${sub.slug}/${prod.slug}`,
                    lastmod: prod.updatedAt || prod.createdAt,
                    images
                  })
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Strapi API Error:', error)
      // Резервный вариант минимального sitemap, если Strapi не отвечает
      urls = [
        { loc: `/`, lastmod: new Date().toISOString() },
        { loc: `/ru/about`, lastmod: '2024-01-01' },
        { loc: `/ru/services`, lastmod: '2024-01-01' },
        { loc: `/ru/contacts`, lastmod: '2024-01-01' },
        { loc: `/ru/cartshopping`, lastmod: new Date().toISOString() },
        { loc: `/en/about`, lastmod: '2024-01-01' },
        { loc: `/en/services`, lastmod: '2024-01-01' },
        { loc: `/en/contacts`, lastmod: '2024-01-01' },
        { loc: `/en/cartshopping`, lastmod: new Date().toISOString() },
        { loc: `/be/about`, lastmod: '2024-01-01' },
        { loc: `/be/services`, lastmod: '2024-01-01' },
        { loc: `/be/contacts`, lastmod: '2024-01-01' },
        { loc: `/be/cartshopping`, lastmod: new Date().toISOString() }
      ]
    }
    
    // Генерируем XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls.map(url => `
  <url>
    <loc>${siteUrl}${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString()}</lastmod>
    <priority>${url.priority || 0.8}</priority>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    ${url.images ? url.images.map(img => `
    <image:image>
      <image:loc>${img.loc}</image:loc>
    </image:image>`).join('') : ''}
  </url>
 `).join('')}
</urlset>`

    // Записываем в файл
    const outputPath = './sitemap.xml'
    writeFileSync(outputPath, xml)
    console.log('✅ Sitemap generated successfully!')
    
 } catch (error) {
    console.error('❌ Sitemap generation failed:', error)
    // process.exit(1) - закомментировано для избежания ошибок типизации
 }
}

// Вызов функции для CLI использования (сохранение обратной совместимости)
// Проверяем, запущен ли скрипт напрямую (не импортирован)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Проверяем, что скрипт запущен напрямую (а не импортирован)
if (process.argv[1] === __filename) {
  generateSitemap();
}
```

## Код, предложенный техподдержкой

Техническая поддержка предложила следующий код, который отличается от текущего тем, что включает в себя планировщик задач `node-cron`:

```typescript
// @ts-ignore
import { writeFileSync, existsSync } from 'fs'
import { $fetch } from 'ofetch'
import { resolve, dirname } from 'path'
import cron from 'node-cron'  // <-- Добавлено
import { fileURLToPath } from 'url'

// ... тот же код loadEnv и generateSitemap ...

// --- Планировщик ---
cron.schedule('0 3 * * *', async () => {
console.log('Запуск генерации sitemap по расписанию:', new Date().toISOString())
try {
  await generateSitemap()
} catch (err) {
  console.error('Ошибка при генерации sitemap по крону:', err)
}
})

// --- CLI запуск ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (process.argv[1] === __filename) {
generateSitemap()
}
```

## Анализ различий

### 1. Текущий подход (API-эндпоинт)

**Плюсы:**
- Централизованное управление через Nuxt сервер
- Возможность аутентификации с использованием токена
- Интеграция с Nuxt.js архитектурой
- Возможность мониторинга и логирования через сервер

**Минусы:**
- Проблемы с доступом извне (ошибка 403)
- Зависимость от состояния сервера (должен быть запущен)
- Необходимость настройки внешнего cron для вызова API

### 2. Предложенный подход (node-cron)

**Плюсы:**
- Встроенный планировщик, не требующий внешних вызовов
- Прямое выполнение в Node.js окружении
- Не зависит от состояния веб-сервера

**Минусы:**
- Требует установки дополнительной зависимости (node-cron)
- Планировщик работает только при запущенном Node.js процессе
- Менее гибкая система аутентификации/авторизации
- Сложнее отслеживать выполнение в production среде

## Проблема с текущей реализацией

Основная проблема, с которой столкнулся пользователь:
1. При выполнении curl-запроса к `/api/admin/generate-sitemap` возвращается ошибка 403
2. Подозревается, что переменная окружения `SITEMAP_GENERATION_TOKEN` недоступна в runtime
3. На хостинге не удается корректно настроить cron-задачу для вызова API-эндпоинта

## Рекомендации

### Вариант 1: Исправление текущего API-эндпоинта

1. Проверить доступность переменной окружения `SITEMAP_GENERATION_TOKEN` на хостинге
2. Убедиться, что переменная правильно установлена в настройках Node.js приложения
3. Проверить настройки CORS, если применимо
4. Попробовать использовать более простую проверку аутентификации

### Вариант 2: Использование node-cron (предложенный техподдержкой)

1. Установить зависимость `node-cron`: `npm install node-cron`
2. Модифицировать скрипт генерации sitemap для включения планировщика
3. Запускать приложение с этим скриптом как часть основного процесса
4. Убедиться, что планировщик работает корректно в окружении хостинга

### Вариант 3: Комбинированный подход

1. Оставить API-эндпоинт для ручного вызова
2. Создать отдельный скрипт с node-cron для автоматической генерации
3. Оба подхода используют одну и ту же функцию `generateSitemap`

## Заключение

Предложенный технической поддержкой код действительно основан на вашем существующем скрипте, но с добавлением встроенного планировщика. Наиболее подходящий вариант решения зависит от архитектуры вашего хостинга и ограничений, накладываемых на cron-задачи.

Если хостинг ограничивает доступ к внутренним API извне или имеет проблемы с переменными окружения для внешних вызовов, то использование node-cron внутри приложения может быть более надежным решением.