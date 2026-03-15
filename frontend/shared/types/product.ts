import type { Image } from "./image";

export type Product = {
  id: number;
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
  };
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: Image[];
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
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
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
