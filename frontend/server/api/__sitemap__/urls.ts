// Добавляем главную страницу
const urls = [{ loc: `/`, lastmod: new Date().toISOString() }]

export default defineEventHandler(async () => {
  const strapiUrl = process.env.NUXT_PUBLIC_STRAPI_URL
  const langs = ['ru', 'be']

  for (const lang of langs) {
    try {
      // Получаем категории для локали
      const categories = await $fetch(`${strapiUrl}/api/categories?populate=image&locale=${lang}`, {
        headers: { Authorization: `Bearer ${process.env.NUXT_STRAPI_TOKEN}` }
      }).catch(() => ({ data: [] })) as { data: any[] }

      // Получаем подкатегории с продуктами для локали
      const subcategories = await $fetch(`${strapiUrl}/api/subcategories?populate=products,category,products.image&locale=${lang}`, {
        headers: { Authorization: `Bearer ${process.env.NUXT_STRAPI_TOKEN}` }
      }).catch(() => ({ data: [] })) as { data: any[] }

      // Получаем продукты, которые напрямую связаны с категориями (не через подкатегории)
      const products = await $fetch(`${strapiUrl}/api/products?populate=category,image&locale=${lang}`, {
        headers: { Authorization: `Bearer ${process.env.NUXT_STRAPI_TOKEN}` }
      }).catch(() => ({ data: [] })) as { data: any[] }

      // Добавляем статические страницы для локали
      urls.push({ loc: `/${lang}/about`, lastmod: '2024-01-01' })
      urls.push({ loc: `/${lang}/services`, lastmod: '2024-01-01' })
      urls.push({ loc: `/${lang}/contacts`, lastmod: '2024-01-01' })
      urls.push({ loc: `/${lang}/cartshopping`, lastmod: new Date().toISOString() })

      // Create a map of category ID to subcategories for easier lookup
      const categorySubcategoriesMap: Record<string, any[]> = {};
      if (subcategories.data) {
        for (const sub of subcategories.data) {
          if (sub.category) {
            const categoryId = sub.category.id;
            if (!categorySubcategoriesMap[categoryId]) {
              categorySubcategoriesMap[categoryId] = [];
            }
            categorySubcategoriesMap[categoryId].push(sub);
          }
        }
      }

      // Добавляем категории для локали
      if (categories.data) {
        for (const cat of categories.data) {
          urls.push({ loc: `/${lang}/${cat.slug}`, lastmod: cat.updatedAt || cat.createdAt })
          
          // Добавляем подкатегории для этой категории
          if (categorySubcategoriesMap[cat.id]) {
            for (const sub of categorySubcategoriesMap[cat.id]) {
              urls.push({ loc: `/${lang}/${cat.slug}/${sub.slug}`, lastmod: sub.updatedAt || sub.createdAt })
              
              // Добавляем продукты для этой подкатегории
              if (sub.products && Array.isArray(sub.products)) {
                for (const prod of sub.products) {
                  urls.push({
                    loc: `/${lang}/${cat.slug}/${sub.slug}/${prod.slug}`,
                    lastmod: prod.updatedAt || prod.createdAt,
                  })
                }
              }
            }
          }
        }
      }

      // Добавляем продукты, которые напрямую связаны с категориями (не через подкатегории)
      if (products.data) {
        for (const prod of products.data) {
          if (prod.category && !prod.subcategory?.data) { // Только продукты, которые напрямую связаны с категорией
            urls.push({
              loc: `/${lang}/${prod.category.slug}/${prod.slug}`,
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

