// export default defineEventHandler(async (event) => {
//   // 1. Проверка секретного ключа для безопасности
//   const headers = getHeaders(event)
//   const secret = headers['x-webhook-secret']
  
//   // Ваш секретный ключ (должен совпадать с Strapi)
//   const EXPECTED_SECRET = 'your-super-secret-key-12345'
  
//   if (secret !== EXPECTED_SECRET) {
//     console.error('Webhook security error: Invalid secret')
//     throw createError({
//       statusCode: 401,
//       statusMessage: 'Unauthorized - Invalid webhook secret'
//     })
//   }

//   // 2. Получаем данные от Strapi
//   const body = await readBody(event)
//   const { model, entry, event: action } = body

//   console.debug(`[${new Date().toISOString()}] Webhook received: ${model} ${action} - ${entry?.slug || entry?.id}`)

//   // 3. Обработка по типам контента
//   try {
//     switch (model) {
//       case 'product':
//         await purgeProductCache(entry)
//         break
        
//       case 'category':
//         await purgeCategoryCache(entry)
//         break
        
//       case 'subcategory':
//         await purgeSubcategoryCache(entry)
//         break
        
//       default:
//         console.debug(`No cache purge needed for model: ${model}`)
//     }

//     console.debug(`Cache purge completed for ${model}: ${entry?.slug || entry?.id}`)
//     return { success: true, model, action, purged: true }

//   } catch (error) {
//     console.error('Webhook cache purge error:', error)
//     throw createError({
//       statusCode: 500,
//       statusMessage: 'Cache purge failed'
//     })
//   }
// })

// // Функции очистки кеша
// async function purgeProductCache(product: any) {
//   const locales = ['ru', 'en', 'be']
  
//   for (const locale of locales) {
//     // Детальная страница товара
//     await clearCache(`/${locale}/*/*/*/${product.slug}`)
    
//     // Категория и подкатегория
//     if (product.category?.slug) {
//       await clearCache(`/${locale}/${product.category.slug}`)
//       if (product.subcategory?.slug) {
//         await clearCache(`/${locale}/${product.category.slug}/${product.subcategory.slug}`)
//       }
//     }
//   }
// }

// async function purgeCategoryCache(category: any) {
//   const locales = ['ru', 'en', 'be']
  
//   for (const locale of locales) {
//     await clearCache(`/${locale}/${category.slug}`)
//   }
// }

// async function purgeSubcategoryCache(subcategory: any) {
//   const locales = ['ru', 'en', 'be']
  
//   for (const locale of locales) {
//     await clearCache(`/${locale}/*/${subcategory.slug}`)
//   }
// }

// async function clearCache(route: string) {
//   try {
//     // Попытка использовать Nuxt cache API
//     await $fetch('/__nuxt/cache/purge', {
//       method: 'POST',
//       body: { route },
//       timeout: 5000
//     }).catch(() => {
//       // Fallback: запросить страницу для перегенерации
//       $fetch(route, { method: 'GET', timeout: 5000 }).catch(() => {})
//     })
//   } catch (error) {
//     console.error(`Failed to clear cache for: ${route}`, error)
//   }
// }