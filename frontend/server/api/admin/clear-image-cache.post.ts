import { createError, getHeader } from 'h3'
import { clearImageCache } from '../../_utils/clear-image-cache'

interface ClearCacheResponse {
  success: boolean
  message: string
  deletedCount?: number
  error?: string
}

export default defineEventHandler(async (event): Promise<ClearCacheResponse> => {
  // Проверка токена безопасности
  const token = getHeader(event, 'X-Sitemap-Token')
  const expectedToken = process.env.SITEMAP_GENERATION_TOKEN

  if (!token || token !== expectedToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid or missing cache clear token'
    })
  }

  try {
    // Используем общую утилиту для очистки кэша
    const result = await clearImageCache()
    
    if (result.success) {
      return {
        success: true,
        message: result.message,
        deletedCount: result.deletedCount
      }
    } else {
      throw new Error(result.error || 'Unknown error')
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Cache clear failed: ${error.message || 'Unknown error'}`
    })
  }
})