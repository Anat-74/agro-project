import { defineCronHandler } from '#nuxt/cron'
import { clearImageCache } from '../utils/clear-image-cache'

// Запуск очистки кэша изображений каждый день в 2:00
export default defineCronHandler('daily', async () => {
  console.log('Запуск очистки кэша изображений по расписанию:', new Date().toISOString())
  try {
    const result = await clearImageCache()
    if (result.success) {
      console.log('Очистка кэша изображений завершена успешно:', result.message)
    } else {
      console.error('Ошибка при очистке кэша изображений по крону:', result.error)
    }
  } catch (error) {
    console.error('Ошибка при очистке кэша изображений по крону:', error)
  }
}, {
  runOnInit: false, // Не запускаем при инициализации приложения
  timeZone: 'Europe/Moscow' // Указываем часовой пояс
})