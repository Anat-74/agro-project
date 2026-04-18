import { $fetch } from "ofetch";

// Вспомогательная функция для капитализации первой буквы
const capitalizeFirst = (str: string): string => {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Функция для обработки ошибок поиска (без мок-данных)
const handleSearchError = (query?: string, category?: string, limit: number = 5) => {
  return {
    success: false,
    products: [],
    total: 0,
    limit,
    hasMore: false,
    query,
    category,
    error: "Не удалось выполнить поиск. Пожалуйста, попробуйте позже или используйте интерфейс магазина.",
    note: "Используются только реальные данные из базы"
  };
};

// Основная функция поиска товаров
export async function searchProducts(query?: string, category?: string, limit: number = 5) {
  try {
    // Получаем URL Strapi из конфигурации
    const strapiUrl = process.env.STRAPI_URL || "http://127.0.0.1:1337";
    
    // Строим параметры запроса для Strapi v5
    const filters: any = {};
    
    let searchTerms: string[] = [];
    
    if (query) {
      const queryLower = query.toLowerCase().trim();
      
      // Упрощенная логика для поиска товаров
      // Для запросов с "яблок" всегда ищем по "Яблоко" (так как товар "Яблоко Каштель")
      if (queryLower.includes('яблок')) {
        searchTerms = ['Яблоко'];
      } else {
        // Для других запросов используем исходный запрос с заглавной буквы
        searchTerms = [capitalizeFirst(queryLower)];
      }
      
      // Для Strapi v5 используем максимально упрощенный поиск
      // Сложные $or запросы вызывают 500 ошибку в Strapi v5
      if (searchTerms.length > 0) {
        // Используем только первый (самый релевантный) термин
        const mainTerm = searchTerms[0];
        filters.name = { $startsWith: mainTerm };
      }
    }
    
    if (category) {
      // Для поиска по категории нужно найти категорию по slug
      // Сначала найдем ID категории
      const categoryResponse = await $fetch(`${strapiUrl}/api/categories`, {
        params: {
          "filters[slug][$eq]": category,
          "fields[0]": "documentId"
        }
      });
      
      if (categoryResponse.data && categoryResponse.data.length > 0) {
        const categoryId = categoryResponse.data[0].documentId;
        filters.category = { documentId: { $eq: categoryId } };
      }
    }
    
    // Формируем параметры запроса для Strapi v5 (плоский формат)
    const params: Record<string, any> = {
      "pagination[pageSize]": limit,
      "pagination[page]": 1,
      "populate": "*", // В Strapi v5 можно использовать * для всех полей
      "sort": "name:asc"
    };
    
    // Добавляем фильтры для Strapi v5 в плоском формате
    if (filters.name && filters.name.$startsWith) {
      // Фильтр по имени: filters[name][$startsWith]=значение
      params["filters[name][$startsWith]"] = filters.name.$startsWith;
    }
    
    if (filters.category && filters.category.documentId && filters.category.documentId.$eq) {
      // Фильтр по категории: filters[category][documentId][$eq]=id
      params["filters[category][documentId][$eq]"] = filters.category.documentId.$eq;
    }
    
    // Выполняем запрос к Strapi API
    console.log("Searching products with params:", JSON.stringify(params, null, 2));
    console.log("Search URL:", `${strapiUrl}/api/products`);
    console.log("Search terms:", searchTerms);
    
    let response;
    try {
      response = await $fetch(`${strapiUrl}/api/products`, {
        params,
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("Search response received, data count:", response.data?.length || 0);
      if (response.data?.length > 0) {
        console.log("Found products:", response.data.map((item: any) => item.name));
      }
    } catch (fetchError: any) {
      console.error("Fetch error:", fetchError.message);
      console.error("Fetch error details:", fetchError);
      // Возвращаем ошибку
      return handleSearchError(query, category, limit);
    }
    
    // Преобразуем ответ Strapi v5 в наш формат
    const products = (response.data || []).map((item: any) => {
      // Обработка изображения в Strapi v5
      let image = "/image/cart-empty-img.png";
      if (item.image) {
        if (Array.isArray(item.image) && item.image.length > 0) {
          image = item.image[0].url || item.image[0].formats?.thumbnail?.url || "/image/cart-empty-img.png";
        } else if (item.image.url) {
          image = item.image.url;
        }
      }
      
      // Обработка категории в Strapi v5
      let category = "uncategorized";
      let categoryName = "Без категории";
      if (item.category) {
        if (Array.isArray(item.category) && item.category.length > 0) {
          category = item.category[0].slug || "uncategorized";
          categoryName = item.category[0].name || "Без категории";
        } else if (item.category.slug) {
          category = item.category.slug;
          categoryName = item.category.name || "Без категории";
        }
      }
      
      const product = {
        documentId: item.documentId || item.id,
        name: item.name,
        price: item.price || 0,
        slug: item.slug || item.name.toLowerCase().replace(/ /g, '-'),
        description: item.description || "",
        image: image,
        category: category,
        categoryName: categoryName
      };
      
      console.log(`Found product: ${product.name} (documentId: ${product.documentId})`);
      return product;
    });
    
    // Если через Strapi ничего не найдено, возвращаем пустой результат
    if (products.length === 0) {
      console.log("No products found via Strapi");
      return {
        success: true,
        products: [],
        total: 0,
        limit,
        hasMore: false,
        query,
        category,
        note: "По вашему запросу ничего не найдено"
      };
    }
    
    return {
      success: true,
      products,
      total: response.meta?.pagination?.total || products.length,
      limit,
      hasMore: (response.meta?.pagination?.total || 0) > limit,
      query,
      category
    };
  } catch (error) {
    console.error("Error searching products:", error);
    
    // Возвращаем ошибку вместо мок-данных
    return handleSearchError(query, category, limit);
  }
}