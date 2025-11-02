// Скрипт для тестирования функциональности генерации sitemap
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Имитация окружения Nuxt для standalone запуска
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем dotenv если он существует
async function loadEnv() {
  try {
    const dotenv = await import('dotenv');
    const envPath = resolve(process.cwd(), '.env');
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else {
      console.warn('.env file not found, using default values');
    }
  } catch (error) {
    console.warn('dotenv not found, using default values');
  }
}

// Имитация useRuntimeConfig
function mockRuntimeConfig() {
  const siteUrl = process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const strapiUrl = process.env.NUXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337';
  const strapiToken = process.env.NUXT_STRAPI_TOKEN;

  return {
    public: {
      siteUrl,
      strapi: {
        url: strapiUrl
      }
    },
    strapi: {
      token: strapiToken
    }
  };
}

// Глобальная функция для имитации useRuntimeConfig
(global as any).useRuntimeConfig = mockRuntimeConfig;

// Загружаем переменные окружения
await loadEnv();

// Теперь импортируем функцию генерации sitemap
const { generateSitemap } = await import('./server/utils/generate-sitemap');

console.log('Запуск тестирования генерации sitemap...');

try {
  await generateSitemap();
  console.log('Тестирование генерации sitemap завершено успешно');
} catch (error) {
  console.error('Ошибка при тестировании генерации sitemap:', error);
}