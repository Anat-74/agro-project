import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { readdir, stat, unlink } from 'fs/promises'

interface ClearCacheResult {
  success: boolean
  message: string
  deletedCount?: number
  error?: string
}

export async function clearImageCache(): Promise<ClearCacheResult> {
  try {
    // Определяем путь к кэшу nuxt-image
    // Используем тот же путь, что и в nuxt.config.ts
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
    const sevenDaysInMs = 7 * 24 * 60 * 1000 // 7 дней в миллисекундах
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
    return {
      success: false,
      message: 'Cache clear failed',
      error: error.message || 'Unknown error'
    }
  }
}