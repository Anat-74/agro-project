// Источник sitemap для @nuxtjs/sitemap (nuxt.config: sources: ["/api/__sitemap__/urls"]).
//
// Важно: массив ссылок собирается НА КАЖДЫЙ ЗАПРОС. Раньше он был module-level
// и накапливался — повторные вызовы (dev, SWR-перегенерация) дублировали ссылки.
//
// populate — только объектный синтаксис Strapi v5: строка с вложенными путями
// (`populate=category,image`) отдаёт 400, из-за чего товары и подкатегории
// в карту не попадали (ошибка глушилась catch-ем).

const LANGS = ["ru", "be"];

interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

export default defineEventHandler(async (): Promise<SitemapUrl[]> => {
  // runtimeConfig (а не process.env) — значения подставляются Nitro и в проде,
  // где .env не читается автоматически
  const config = useRuntimeConfig();
  const strapiUrl = config.public.strapi?.url || process.env.NUXT_PUBLIC_STRAPI_URL;
  const headers = { Authorization: `Bearer ${config.strapi?.token || process.env.NUXT_STRAPI_TOKEN}` };
  const now = new Date().toISOString();

  // Ссылки текущего запроса. Корень («/») не добавляем: он 307-редиректит на
  // /ru и в карте сайта не нужен — вместо него главные локалей (ниже).
  const urls: SitemapUrl[] = [];

  const get = async (path: string): Promise<any[]> => {
    try {
      // `as any` — Nitro типизирует $fetch по роутам и падает на шаблонной строке
      const response = await $fetch<{ data?: any[] }>(`${strapiUrl}${path}` as any, { headers });
      return response?.data || [];
    } catch (error) {
      console.error(`[sitemap] ${path}:`, error);
      return [];
    }
  };

  for (const lang of LANGS) {
    // Главная локали (у /ru, /be свои title/описание для поиска)
    urls.push({ loc: `/${lang}`, lastmod: now });

    // ===== Статические страницы =====
    // /cartshopping в карту НЕ добавляем: страница корзины не для индекса
    urls.push({ loc: `/${lang}/about`, lastmod: "2024-01-01" });
    urls.push({ loc: `/${lang}/services`, lastmod: "2024-01-01" });
    urls.push({ loc: `/${lang}/contacts`, lastmod: "2024-01-01" });

    // ===== Категории / подкатегории / товары =====
    const categories = await get(
      `/api/categories?locale=${lang}&fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=200`,
    );
    const subcategories = await get(
      `/api/subcategories?locale=${lang}&populate[category]=true&pagination[pageSize]=500`,
    );
    const products = await get(
      `/api/products?locale=${lang}&populate[category]=true&populate[subcategory]=true&pagination[pageSize]=500`,
    );

    for (const cat of categories) {
      if (!cat?.slug) continue;
      urls.push({ loc: `/${lang}/${cat.slug}`, lastmod: cat.updatedAt || now });
    }

    for (const sub of subcategories) {
      const categorySlug = sub?.category?.slug;
      if (!categorySlug || !sub?.slug) continue;
      urls.push({
        loc: `/${lang}/${categorySlug}/${sub.slug}`,
        lastmod: sub.updatedAt || now,
      });
    }

    for (const prod of products) {
      const categorySlug = prod?.category?.slug;
      if (!prod?.slug || !categorySlug) continue;
      const subcategorySlug = prod?.subcategory?.slug;
      urls.push({
        loc: subcategorySlug
          ? `/${lang}/${categorySlug}/${subcategorySlug}/${prod.slug}`
          : `/${lang}/${categorySlug}/${prod.slug}`,
        lastmod: prod.updatedAt || now,
      });
    }

    // ===== Блог: список + статьи локали =====
    urls.push({ loc: `/${lang}/blog`, lastmod: now });

    const posts = await get(
      `/api/blogs?locale=${lang}&fields[0]=slug&fields[1]=updatedAt&sort[0]=date:desc&pagination[pageSize]=500`,
    );
    for (const post of posts) {
      if (!post?.slug) continue;
      urls.push({
        loc: `/${lang}/blog/${post.slug}`,
        lastmod: post.updatedAt || now,
      });
    }
  }

  return urls;
});
