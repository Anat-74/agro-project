// CLI-скрипт для генерации sitemap, использующий серверную функцию
// Для работы в CLI-контексте имитируем необходимые Nuxt функции

// Загружаем dotenv до всего остального
async function loadEnv() {
  try {
    const dotenv = await import('dotenv');
    const path = await import('path');
    const envPath = path.resolve(process.cwd(), '.env');
    dotenv.config({ path: envPath });
  } catch (error) {
    console.warn('dotenv not found, using default values');
  }
}

// Загружаем переменные окружения
await loadEnv();

// Функция для получения переменных окружения с приоритетом
function getEnvVar(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

// Имитация useRuntimeConfig для CLI
// Используем продакшен-переменные, если они доступны, иначе локальные
const mockRuntimeConfig = {
 public: {
    siteUrl: getEnvVar('SITE_URL', getEnvVar('NUXT_PUBLIC_SITE_URL', 'http://localhost:3000')),
    strapi: {
      url: getEnvVar('NUXT_STRAPI_URL', getEnvVar('NUXT_PUBLIC_STRAPI_URL', 'http://127.0.0.1:1337'))
    }
 },
 strapi: {
   token: getEnvVar('NUXT_STRAPI_TOKEN')
 }
};

// Глобальная функция для имитации useRuntimeConfig
(global as any).useRuntimeConfig = () => mockRuntimeConfig;

// Импортируем используем серверную функцию
import { generateSitemap } from '../server/utils/generate-sitemap';

// Вызов функции для CLI использования
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Проверяем, что скрипт запущен напрямую (а не импортирован)
if (process.argv[1] === __filename) {
  generateSitemap().catch(error => {
    console.error('❌ Sitemap generation failed:', error);
    process.exit(1);
  });
}