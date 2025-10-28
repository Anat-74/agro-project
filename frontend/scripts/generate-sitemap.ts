// CLI-скрипт для генерации sitemap, использующий серверную функцию
// Для работы в CLI-контексте имитируем необходимые Nuxt функции

// Имитация useRuntimeConfig для CLI
// Используем продакшен-переменные, если они доступны, иначе локальные
const mockRuntimeConfig = {
  public: {
    siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    strapi: {
      url: process.env.NUXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337'
    }
 },
  strapi: {
    token: process.env.NUXT_STRAPI_TOKEN
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