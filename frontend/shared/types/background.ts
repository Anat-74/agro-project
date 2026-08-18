import type { StrapiImage } from "./image";

export interface BackgroundItem {
  id: number; // В Strapi v5 у repeatable-компонентов числовой id
  title: string;
  imageAvif: StrapiImage;
  imageWebp: StrapiImage;
  thumbnail?: StrapiImage | null;
  isDefault?: boolean;
}

export interface BackgroundData {
  enableBackground: boolean;
  options: BackgroundItem[];
}
