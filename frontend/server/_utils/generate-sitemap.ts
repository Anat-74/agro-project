import { writeFileSync, existsSync } from 'fs'
import { $fetch } from 'ofetch'
import { resolve } from 'path'

async function loadEnv() {
  try {
    const dotenv = await import('dotenv')
    const envPath = resolve(process.cwd(), '.env')
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath })
    } else {
      console.warn('.env file not found, using default values')
    }
  } catch {
    console.warn('dotenv not found, using default values')
  }
}

interface SitemapUrl {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: string
 images?: Array<{ loc: string }>
}

export async function generateSitemap() {
 // Загружаем переменные окружения на случай, если runtime config недоступен
  await loadEnv()
  
  // Для серверного контекста Nuxt используем runtime config
  // В CLI-контексте useRuntimeConfig может не работать, поэтому используем process.env как резервный вариант
  let siteUrl, strapiUrl, strapiToken;
  
  try {
    const config = useRuntimeConfig();
    siteUrl = config.public.siteUrl || process.env.SITE_URL;
    strapiUrl = config.public.strapi.url || process.env.NUXT_PUBLIC_STRAPI_URL;
    strapiToken = config.strapi.token || process.env.NUXT_STRAPI_TOKEN;
  } catch {
    // Если useRuntimeConfig недоступен (например, в CLI-контексте), используем process.env
    siteUrl = process.env.SITE_URL;
    strapiUrl = process.env.NUXT_PUBLIC_STRAPI_URL;
    strapiToken = process.env.NUXT_STRAPI_TOKEN;
  }
  
  console.debug('Strapi URL:', strapiUrl)

  let urls: SitemapUrl[] = []
  
  try {
    // Преобразуем данные Strapi в формат sitemap
    const langs = ['ru', 'be']
    
    // Получаем данные напрямую из API Strapi (более надёжно, чем Nuxt API)
    
    try {
      // Добавляем статические страницы
      for (const lang of langs) {
        urls.push({ loc: `/${lang}/about`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/services`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/contacts`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/cartshopping`, lastmod: new Date().toISOString() })
      }
      
      // Use the correct populate structure as per Strapi relationships (corrected syntax)
      for (const lang of langs) {
        const [categoriesRes, subcategoriesRes, productsRes] = await Promise.all([
          $fetch(`${strapiUrl}/api/categories?populate=image&locale=${lang}`, {
            headers: { Authorization: `Bearer ${strapiToken}` }
          }).catch(() => ({ data: [] })),
          $fetch(`${strapiUrl}/api/subcategories?populate=products&populate=category&populate=products.image&populate=image&locale=${lang}`, {
            headers: { Authorization: `Bearer ${strapiToken}` }
          }).catch(() => ({ data: [] })),
          $fetch(`${strapiUrl}/api/products?populate=category&populate=image&locale=${lang}`, {
            headers: { Authorization: `Bearer ${strapiToken}` }
          }).catch(() => ({ data: [] }))
        ])
        
        console.debug('Categories data for locale', lang, ':', categoriesRes.data?.length);
        console.debug('Subcategories data for locale', lang, ':', subcategoriesRes.data?.length);
        console.debug('Products directly related to categories data for locale', lang, ':', productsRes.data?.length);
        console.debug('Sample product data:', JSON.stringify(productsRes.data?.find((p: any) => p.slug === 'test-product'), null, 2));
        console.debug('Subcategories data with products:', JSON.stringify(subcategoriesRes.data?.[0], null, 2));
        
        // Create a map of category ID to subcategories for easier lookup
        const categorySubcategoriesMap: Record<string, any[]> = {};
        if (subcategoriesRes.data) {
          for (const sub of subcategoriesRes.data) {
            if (sub.category) {
              const categoryId = sub.category.id;
              if (!categorySubcategoriesMap[categoryId]) {
                categorySubcategoriesMap[categoryId] = [];
              }
              categorySubcategoriesMap[categoryId].push(sub);
            }
          }
        }
        
        // Add categories for all locales
        if (categoriesRes.data) {
          for (const cat of categoriesRes.data) {
            // Extract images from category data
            // The image field is an array, so we need to map all images
            const catImages = cat.image && Array.isArray(cat.image)
              ? cat.image.map((img: any) => ({
                  loc: `${strapiUrl}${img.url}`
                }))
              : []
            urls.push({
              loc: `/${lang}/${cat.slug}`,
              lastmod: cat.updatedAt || cat.createdAt,
              images: catImages
            })
          }
        }
        
        // Add subcategories and products for all locales
        if (subcategoriesRes.data) {
          for (const sub of subcategoriesRes.data) {
            // Add subcategory page
            if (sub.category) {
              for (const lang of langs) {
                // Extract images from subcategory data
                // The image field is an array, so we need to map all images
                const subImages = sub.image && Array.isArray(sub.image)
                  ? sub.image.map((img: any) => ({
                      loc: `${strapiUrl}${img.url}`
                    }))
                  : []
                urls.push({
                  loc: `/${lang}/${sub.category.slug}/${sub.slug}`,
                  lastmod: sub.updatedAt || sub.createdAt,
                  images: subImages
                })
                
                // Add products for this subcategory
                if (sub.products && Array.isArray(sub.products)) {
                  for (const prod of sub.products) {
                    // Извлекаем изображения из данных продукта
                    // Поле изображения - это массив, поэтому нам нужно отобразить все изображения
                    const images = prod.image && Array.isArray(prod.image)
                      ? prod.image.map((img: any) => ({
                          loc: `${strapiUrl}${img.url}`
                        }))
                      : []
                    urls.push({
                      loc: `/${lang}/${sub.category.slug}/${sub.slug}/${prod.slug}`,
                      lastmod: prod.updatedAt || prod.createdAt,
                      images
                    })
                  }
                }
              }
            }
          }
        }

        // Add products that are directly related to categories (not through subcategories)
        if (productsRes.data) {
          for (const prod of productsRes.data) {
            if (prod.category) {
              for (const lang of langs) {
                // Извлекаем изображения из данных продукта
                // В Strapi v5 изображения находятся в массиве image
                const images = prod.image && Array.isArray(prod.image)
                  ? prod.image.map((img: any) => ({
                      loc: `${strapiUrl}${img.url}`
                    }))
                  : [];
                
                urls.push({
                  loc: `/${lang}/${prod.category.slug}/${prod.slug}`,
                  lastmod: prod.updatedAt || prod.createdAt,
                  images
                });
              }
            }
          }
        }
      }
     } catch (error) {
      console.error('Strapi API Error:', error)
      // Резервный вариант минимального sitemap, если Strapi не отвечает
      urls = [
        { loc: `/`, lastmod: new Date().toISOString() },
        { loc: `/ru/about`, lastmod: '2024-01-01' },
        { loc: `/ru/services`, lastmod: '2024-01-01' },
        { loc: `/ru/contacts`, lastmod: '2024-01-01' },
        { loc: `/ru/cartshopping`, lastmod: new Date().toISOString() },
        { loc: `/be/about`, lastmod: '2024-01-01' },
        { loc: `/be/services`, lastmod: '2024-01-01' },
        { loc: `/be/contacts`, lastmod: '2024-01-01' },
        { loc: `/be/cartshopping`, lastmod: new Date().toISOString() }
      ]
    }
    
    // Генерируем XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urls.map(url => `
  <url>
    <loc>${siteUrl}${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString()}</lastmod>
    <priority>${url.priority || 0.8}</priority>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    ${url.images ? url.images.map(img => `
    <image:image>
      <image:loc>${img.loc}</image:loc>
    </image:image>`).join('') : ''}
  </url>
 `).join('')}
</urlset>`

    // Записываем в файл
    const outputPath = './sitemap.xml'
    writeFileSync(outputPath, xml)
    
    console.debug(`✅ Sitemap generated successfully at ${outputPath}`)
    console.debug(`✅ Using site URL: ${siteUrl}`)
    console.debug('✅ Sitemap generated successfully!')
    
 } catch (error) {
    console.error('❌ Sitemap generation failed:', error)
    // process.exit(1) - закомментировано для избежания ошибок типизации
 }
}