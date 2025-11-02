import { defineCronHandler } from '#nuxt/cron'
import { generateSitemap } from '../_utils/generate-sitemap'

// Запуск генерации sitemap каждый час
export default defineCronHandler('hourly', async () => {
  console.log('Запуск генерации sitemap по расписанию:', new Date().toISOString(), 'Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone)
  try {
    await generateSitemap()
    console.log('Генерация sitemap завершена успешно')
  } catch (error) {
    console.error('Ошибка при генерации sitemap по крону:', error)
  }
}, {
  runOnInit: false, // Не запускаем при инициализации приложения
 timeZone: 'Europe/Moscow' // Указываем часовой пояс
})