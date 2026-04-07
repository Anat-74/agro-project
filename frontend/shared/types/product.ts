import type { Image } from "./image";

export type Product = {
  id: string; // В Strapi v5 это documentId
  name: string;
  slug: string;
  price: number;
  description: string;
  characteristics: string;
  isAvailable?: boolean;
  isDiscount?: boolean;
  image: Image[];
  mainImage?: Image;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    structuredData?: any;
  } | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: Image[] | null;
  category?: {
    slug: string;
  };
  subcategory?: {
    slug: string;
    category?: {
      slug: string;
    };
  };
  locale?: string;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  localizations?: any[]; // Новое поле в Strapi v5
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

export type ProductsResponse = {
  data: Product[];
  meta: {
    pagination: PaginationMeta;
  };
};