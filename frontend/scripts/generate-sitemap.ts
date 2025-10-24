// @ts-ignore
import { writeFileSync } from 'fs'
import { $fetch } from 'ofetch'

async function loadEnv() {
  try {
    const dotenv = await import('dotenv')
    dotenv.config()
  } catch (error) {
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

async function generateSitemap() {
  // Загружаем переменные окружения
  await loadEnv()
  
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000'
  const strapiUrl = process.env.NUXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337'
  const strapiToken = process.env.NUXT_STRAPI_TOKEN || '64acd09db50794111c1b62365941ac1a5a45a54fee8e5b4b882b838d9445de32a16f000532908f67c7fe211cd66e9cd88b691005c25dae4493fc897acce3ce6131b9bc1cd202ce01e2bae8ac6d53338f4a632b6193df492582e49bc41b4213eeaa1fe47a714ac3dc1c986ebcad539a0778e4c20c5d3d5974d57591e89d382350'
  
  console.log('Strapi URL:', strapiUrl) // Отладочный вывод

  let urls: SitemapUrl[] = []
  
  try {
    // Transform Strapi data to sitemap format
    const langs = ['ru', 'en', 'be']
    const mainLocale = 'ru'; // Основная локаль, где есть все данные
    
    // Get data directly from Strapi API (more reliable than Nuxt API)
    
    try {
      // Add static pages
      for (const lang of langs) {
        urls.push({ loc: `/${lang}/about`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/services`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/contacts`, lastmod: '2024-01-01' })
        urls.push({ loc: `/${lang}/cartshopping`, lastmod: new Date().toISOString() })
      }
      
      // Fetch data only for the main locale where data exists
      // Use the correct populate structure as per Strapi relationships
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        $fetch(`${strapiUrl}/api/categories?populate=image&locale=${mainLocale}`, {
          headers: { Authorization: `Bearer ${strapiToken}` }
        }).catch(() => ({ data: [] })),
        $fetch(`${strapiUrl}/api/subcategories?populate=products&populate=category&populate=products.image&populate=image&locale=${mainLocale}`, {
          headers: { Authorization: `Bearer ${strapiToken}` }
        }).catch(() => ({ data: [] }))
      ])
      
      console.log('Categories data for main locale', mainLocale, ':', categoriesRes.data?.length);
      console.log('Subcategories data for main locale', mainLocale, ':', subcategoriesRes.data?.length);
      console.log('Subcategories data with products:', JSON.stringify(subcategoriesRes.data?.[0], null, 2));
      
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
      
      // Add categories and subcategories for all locales
      if (categoriesRes.data) {
        for (const cat of categoriesRes.data) {
          for (const lang of langs) {
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
            
            // Add subcategories for this category
            const subcategoriesForCat = categorySubcategoriesMap[cat.id] || [];
            for (const sub of subcategoriesForCat) {
              // Extract images from subcategory data
              // The image field is an array, so we need to map all images
              const subImages = sub.image && Array.isArray(sub.image)
                ? sub.image.map((img: any) => ({
                    loc: `${strapiUrl}${img.url}`
                  }))
                : []
              urls.push({
                loc: `/${lang}/${cat.slug}/${sub.slug}`,
                lastmod: sub.updatedAt || sub.createdAt,
                images: subImages
              })
            }
          }
        }
      }
      
      // Add products for all locales using subcategory data
      if (subcategoriesRes.data) {
        for (const sub of subcategoriesRes.data) {
          if (sub.products && Array.isArray(sub.products)) {
            for (const prod of sub.products) {
              if (sub.category) {
                for (const lang of langs) {
                  // Extract images from product data
                  // The image field is an array, so we need to map all images
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
    } catch (error) {
      console.error('Strapi API Error:', error)
      // Fallback to minimal sitemap if Strapi fails
      urls = [
        { loc: `/`, lastmod: new Date().toISOString() },
        { loc: `/ru/about`, lastmod: '2024-01-01' },
        { loc: `/ru/services`, lastmod: '2024-01-01' },
        { loc: `/ru/contacts`, lastmod: '2024-01-01' },
        { loc: `/ru/cartshopping`, lastmod: new Date().toISOString() },
        { loc: `/en/about`, lastmod: '2024-01-01' },
        { loc: `/en/services`, lastmod: '2024-01-01' },
        { loc: `/en/contacts`, lastmod: '2024-01-01' },
        { loc: `/en/cartshopping`, lastmod: new Date().toISOString() },
        { loc: `/be/about`, lastmod: '2024-01-01' },
        { loc: `/be/services`, lastmod: '2024-01-01' },
        { loc: `/be/contacts`, lastmod: '2024-01-01' },
        { loc: `/be/cartshopping`, lastmod: new Date().toISOString() }
      ]
    }
    
    // Generate XML sitemap
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

    // Write to file
    const outputPath = './sitemap.xml'
    writeFileSync(outputPath, xml)
    console.log('✅ Sitemap generated successfully!')
    
 } catch (error) {
    console.error('❌ Sitemap generation failed:', error)
    // process.exit(1) - закомментировано для избежания ошибок типизации
 }
}

generateSitemap()