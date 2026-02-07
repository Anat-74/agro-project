export type Image = {
  id: number;
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
};

export interface StrapiImage {
  id: number;
  url: string;
  alternativeText: string | null;
  documentId?: string;
}
