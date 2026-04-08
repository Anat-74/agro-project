import type { Image } from "./image";
import type { Product } from "./product";
import type { PaginationMeta } from "./product";

export type Category = {
  id: string; // В Strapi v5 это documentId
  name: string;
  slug: string;
  description?: string;
  locale?: string;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  image: Image[];
  subcategories?: Subcategory[];
  products?: Product[];
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: Image[] | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    structuredData?: any;
  } | null;
  localizations?: any[]; // Новое поле в Strapi v5
};

export type Subcategory = {
  id: string; // В Strapi v5 это documentId
  name: string;
  slug: string;
  description?: string;
  price: string;
  locale?: string;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  image: Image[];
  products?: Product[];
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: Image[] | null;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    structuredData?: any;
  } | null;
  localizations?: any[]; // Новое поле в Strapi v5
};

export type SubcategoriesResponse = {
  data: Subcategory[];
  meta: {
    pagination: PaginationMeta;
  };
};
