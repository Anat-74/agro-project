import { $fetch } from "ofetch";

interface RecommendationProduct {
  documentId: string;
  id: string;
  name: string;
  price: number;
  slug: string;
  image: string;
  category: string;
  categoryName: string;
  isDiscount: boolean;
}

interface RecommendationResult {
  success: boolean;
  products: RecommendationProduct[];
  total: number;
  basedOn: string;
  note?: string;
  error?: string;
}

function handleImage(item: any): string {
  if (item.image) {
    if (Array.isArray(item.image) && item.image.length > 0) {
      return item.image[0].url || item.image[0].formats?.thumbnail?.url || "/image/cart-empty-img.png";
    }
    if (item.image.url) {
      return item.image.url;
    }
  }
  return "/image/cart-empty-img.png";
}

function handleCategory(item: any): { slug: string; name: string } {
  if (item.category) {
    if (Array.isArray(item.category) && item.category.length > 0) {
      return {
        slug: item.category[0].slug || "uncategorized",
        name: item.category[0].name || "Без категории",
      };
    }
    if (item.category.slug) {
      return {
        slug: item.category.slug,
        name: item.category.name || "Без категории",
      };
    }
  }
  return { slug: "uncategorized", name: "Без категории" };
}

function mapProducts(data: any[]): RecommendationProduct[] {
  return (data || []).map((item: any) => {
    const image = handleImage(item);
    const cat = handleCategory(item);
    return {
      documentId: item.documentId || item.id,
      id: item.documentId || item.id,
      name: item.name,
      price: item.price || 0,
      slug: item.slug || item.name?.toLowerCase().replace(/ /g, "-") || "",
      image,
      category: cat.slug,
      categoryName: cat.name,
      isDiscount: item.isDiscount || false,
    };
  });
}

export async function getRecommendations(
  basedOn: "category" | "latest" | "discount",
  sourceType?: string,
  sourceId?: string,
  limit: number = 5,
  strapiUrl?: string,
): Promise<RecommendationResult> {
  try {
    const { strapi: { url: configUrl } } = useRuntimeConfig();
    const baseUrl = strapiUrl || configUrl || "http://127.0.0.1:1337";

    if (basedOn === "category") {
      if (!sourceId) {
        return {
          success: false,
          products: [],
          total: 0,
          basedOn,
          note: "Для рекомендаций по категории требуется sourceId товара",
        };
      }

      const productResponse = await $fetch(`${strapiUrl}/api/products`, {
        params: {
          "filters[documentId][$eq]": sourceId,
          "populate": "category",
          "pagination[pageSize]": 1,
        },
      });

      const productData = productResponse.data?.[0];
      if (!productData) {
        return {
          success: false,
          products: [],
          total: 0,
          basedOn,
          note: "Товар не найден",
        };
      }

      const cat = handleCategory(productData);
      if (cat.slug === "uncategorized") {
        return {
          success: false,
          products: [],
          total: 0,
          basedOn,
          note: "У товара нет категории",
        };
      }

      const categoryResponse = await $fetch(`${strapiUrl}/api/categories`, {
        params: {
          "filters[slug][$eq]": cat.slug,
          "fields[0]": "documentId",
        },
      });

      const categoryId = categoryResponse.data?.[0]?.documentId;
      if (!categoryId) {
        return {
          success: false,
          products: [],
          total: 0,
          basedOn,
          note: "Категория не найдена",
        };
      }

      const similarResponse = await $fetch(`${strapiUrl}/api/products`, {
        params: {
          "filters[category][documentId][$eq]": categoryId,
          "filters[documentId][$ne]": sourceId,
          "sort": "createdAt:desc",
          "pagination[pageSize]": limit,
          "populate": "*",
        },
      });

      const products = mapProducts(similarResponse.data || []);
      return {
        success: true,
        products,
        total: products.length,
        basedOn,
      };
    }

    if (basedOn === "latest") {
      const response = await $fetch(`${strapiUrl}/api/products`, {
        params: {
          "sort": "createdAt:desc",
          "pagination[pageSize]": limit,
          "populate": "*",
        },
      });

      const products = mapProducts(response.data || []);
      return {
        success: true,
        products,
        total: products.length,
        basedOn,
      };
    }

    if (basedOn === "discount") {
      const response = await $fetch(`${strapiUrl}/api/products`, {
        params: {
          "filters[isDiscount][$eq]": true,
          "sort": "createdAt:desc",
          "pagination[pageSize]": limit,
          "populate": "*",
        },
      });

      const products = mapProducts(response.data || []);
      return {
        success: true,
        products,
        total: products.length,
        basedOn,
      };
    }

    return {
      success: false,
      products: [],
      total: 0,
      basedOn,
      error: `Неизвестный тип рекомендаций: ${basedOn}`,
    };
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    return {
      success: false,
      products: [],
      total: 0,
      basedOn,
      error: `Ошибка получения рекомендаций: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
