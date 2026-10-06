/**
 * Статическая страница-одиночка (about / contacts / services).
 * Strapi v5 отдаёт single type объектом, но через `find` тип выводится как массив —
 * в страницах нормализуем результат (см. `asArray`-паттерн в страницах).
 */
export interface SitePageSeo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  structuredData?: unknown;
}

export interface SitePage {
  title?: string | null;
  content?: string | null;
  seo?: SitePageSeo | null;
}
