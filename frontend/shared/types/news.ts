/** Новость (коллекция `news-articles`) */
export interface NewsSeo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  structuredData?: unknown;
}

export interface NewsArticle {
  documentId?: string;
  id?: number;
  slug?: string;
  title?: string;
  date?: string;
  content?: string;
  image?: { url?: string; alternativeText?: string | null } | null;
  seo?: NewsSeo | null;
}
