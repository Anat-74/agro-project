export type Image = {
  id: string; // В Strapi v5 это documentId
  url: string;
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  ext?: string;
  formats?: {
    thumbnail?: Image;
    small?: Image;
  };
  hash?: string;
  width?: number;
  height?: number;
  mime?: string;
  size?: number;
  previewUrl?: string | null;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  documentId?: string;
};

export interface StrapiImage {
  id: string; // В Strapi v5 это documentId
  url: string;
  alternativeText: string | null;
  documentId?: string;
}
