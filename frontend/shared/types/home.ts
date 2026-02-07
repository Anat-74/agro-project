export interface HeroSlide {
  id: number;
  backgroundImage?: {
    id: number;
    retinaBgImageAvif?: {
      id: number;
      url: string;
      alternativeText?: string;
      documentId?: string;
    };
    baseBgImageWebp?: {
      id: number;
      url: string;
      alternativeText?: string;
      documentId?: string;
    };
  };
  image?: {
    id: number;
    url: string;
    alternativeText?: string;
    documentId?: string;
  };
  textTop?: string;
  heading?: string;
  saleText?: string;
  textBottom?: string;
  textLink?: string;
  isDiscount?: boolean;
  isTextBottom?: boolean;
}

export interface HeroGrid {
  id: number;
  icons?: {
    id: number;
    url: string;
    alternativeText?: string;
    documentId?: string;
  };
  heading?: string;
  text?: string;
  isVisible?: boolean;
}

export interface FeaturedProduct {
  id: number;
  heading?: string;
  link?: string;
  backgroundImage?: {
    id: number;
    retinaBgImageAvif?: {
      id: number;
      url: string;
      alternativeText?: string;
      documentId?: string;
    };
    baseBgImageWebp?: {
      id: number;
      url: string;
      alternativeText?: string;
      documentId?: string;
    };
  };
  products: Array<{
    id: number;
    documentId: string;
    name: string;
    price: number;
    slug: string;
    isAvailable: boolean;
    isDiscount: boolean;
    locale: string;
    image?: Array<{
      id: number;
      documentId: string;
      alternativeText: string | null;
      url: string;
    }>;
    category?: {
      id: number;
      documentId: string;
      name: string;
      slug: string;
    };
  }>;
  __component: string;
}

export type HomePage = {
  id: number;
  name?: string;
  description?: string;
  heroSlider: HeroSlide[];
  heroGrids: HeroGrid[];
  featuredProducts: FeaturedProduct[];
  locale?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    structuredData?: any;
  };
};
