// Добавляем главную страницу
const urls = [{ loc: `/`, lastmod: new Date().toISOString() }]

export default defineEventHandler(async () => {
  const strapiUrl = process.env.NUXT_PUBLIC_STRAPI_URL
  const langs = ['ru', 'en', 'be']

  for (const lang of langs) {
    try {
      // Получаем категории с подкатегориями для локали
      const categories = await $fetch(`${strapiUrl}/api/categories?populate=subcategories&locale=${lang}`, {
        headers: { Authorization: `Bearer ${process.env.NUXT_STRAPI_TOKEN}` }
      }).catch(() => ({ data: [] })) as { data: any[] }

      // Получаем продукты с подкатегорией для локали
      const products = await $fetch(`${strapiUrl}/api/products?populate=subcategory.category`, {
        headers: { Authorization: `Bearer ${process.env.NUXT_STRAPI_TOKEN}` }
      }).catch(() => ({ data: [] })) as { data: any[] }

      // Добавляем статические страницы для локали
      urls.push({ loc: `/${lang}/about`, lastmod: '2024-01-01' })
      urls.push({ loc: `/${lang}/services`, lastmod: '2024-01-01' })
      urls.push({ loc: `/${lang}/contacts`, lastmod: '2024-01-01' })
      urls.push({ loc: `/${lang}/cartshopping`, lastmod: new Date().toISOString() })

      // Добавляем категории для локали
      if (categories.data) {
        for (const cat of categories.data) {
          urls.push({ loc: `/${lang}/${cat.slug}`, lastmod: cat.updatedAt || cat.createdAt })
          // Добавляем подкатегории
          if (cat.subcategories?.data) {
            for (const sub of cat.subcategories.data) {
              urls.push({ loc: `/${lang}/${cat.slug}/${sub.slug}`, lastmod: sub.updatedAt || sub.createdAt })
            }
          }
        }
      }

      // Добавляем продукты для локали
      if (products.data) {
        for (const prod of products.data) {
          if (prod.subcategory?.data && prod.subcategory.data.category) {
            urls.push({
              loc: `/${lang}/${prod.subcategory.data.category.slug}/${prod.subcategory.data.slug}/${prod.slug}`,
               lastmod: prod.updatedAt || prod.createdAt,
            })
          }
        }
      }
    } catch (error) {
      console.error(`Ошибка получения данных для локали ${lang}:`, error)
      // Продолжаем с другими локалями
    }
  }

  return urls
})
