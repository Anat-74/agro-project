import { generateSitemap } from '../../_utils/generate-sitemap'
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