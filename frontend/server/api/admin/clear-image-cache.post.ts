import { createError, getHeader } from 'h3'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { readdir, stat, unlink } from 'fs/promises'

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
    // Определяем путь к кэшу nuxt-image
    const cacheDir = resolve('./node_modules/.cache/nuxt-image')
    
    // Проверяем, существует ли директория кэша
    if (!existsSync(cacheDir)) {
      return {
        success: true,
        message: 'Cache directory does not exist, nothing to clear'
      }
    }

    // Получаем список файлов в кэше
    const files = await readdir(cacheDir).catch(() => [])
    const now = Date.now()
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000 // 7 дней в миллисекундах
    let deletedCount = 0

    // Фильтруем файлы, старше 7 дней
    for (const file of files) {
      const filePath = join(cacheDir, file)
      
      try {
        const fileStat = await stat(filePath)
        
        // Если файл старше 7 дней, удаляем его
        if (fileStat.isFile() && (now - fileStat.mtimeMs) > sevenDaysInMs) {
          await unlink(filePath)
          deletedCount++
        }
      } catch (err) {
        // Пропускаем файлы, к которым нет доступа
        console.warn(`Could not access file: ${filePath}`, err)
      }
    }

    return {
      success: true,
      message: `Cache cleared successfully. ${deletedCount} files deleted.`,
      deletedCount
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Cache clear failed: ${error.message || 'Unknown error'}`
    })
  }
})