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
export async function searchProducts(
  query?: string,
  category?: string,
  limit: number = 5,
  minPrice?: number,
  maxPrice?: number,
  inStock?: boolean,
  isDiscount?: boolean,
  strapiUrl?: string,
  locale?: string,
) {
  try {
    // Получаем URL Strapi из конфигурации
    const { strapi: { url: configUrl } } = useRuntimeConfig();
    const baseUrl = strapiUrl || configUrl || "http://127.0.0.1:1337";
    
    // Строим параметры запроса для Strapi v5
    const filters: any = {};
    
    let searchTerms: string[] = [];
    
    if (query) {
      const queryLower = query.toLowerCase().trim();
      searchTerms = [capitalizeFirst(queryLower)];

      // Для русских окончаний множественного числа добавляем вариант без "и"/"ы"
      if (queryLower.endsWith('и') || queryLower.endsWith('ы')) {
        const singular = queryLower.slice(0, -1);
        if (singular.length >= 2) {
          searchTerms.push(capitalizeFirst(singular));
        }
      }

      // Для Strapi v5 используем максимально упрощенный поиск
      // Сложные $or запросы вызывают 500 ошибку в Strapi v5
      if (searchTerms.length > 0) {
        // Используем только первый (самый релевантный) термин
        const mainTerm = searchTerms[0];
        filters.name = { $contains: mainTerm };
      }
    }
    
    if (category) {
      // Для поиска по категории нужно найти категорию по slug
      // Сначала найдем ID категории
      const categoryResponse = await $fetch(`${baseUrl}/api/categories`, {
        params: {
          "filters[slug][$eq]": category,
          "fields[0]": "documentId",
          "locale": locale || "ru"
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
      "populate": "*",
      "sort": "name:asc"
    };

    if (locale) {
      params["locale"] = locale;
    }
    
    // Добавляем фильтры для Strapi v5 в плоском формате
    if (filters.name && filters.name.$contains) {
      // Фильтр по имени: filters[name][$contains]=значение
      params["filters[name][$contains]"] = filters.name.$contains;
    }
    
    if (filters.category && filters.category.documentId && filters.category.documentId.$eq) {
      // Фильтр по категории: filters[category][documentId][$eq]=id
      params["filters[category][documentId][$eq]"] = filters.category.documentId.$eq;
    }
    
    if (minPrice !== undefined) {
      params["filters[price][$gte]"] = minPrice;
    }
    
    if (maxPrice !== undefined) {
      params["filters[price][$lte]"] = maxPrice;
    }
    
    if (inStock === true) {
      params["filters[isAvailable][$eq]"] = true;
    }
    
    if (isDiscount === true) {
      params["filters[isDiscount][$eq]"] = true;
    }
    
    // Выполняем запрос к Strapi API
    console.log("Searching products with params:", JSON.stringify(params, null, 2));
    console.log("Search URL:", `${baseUrl}/api/products`);
    console.log("Search terms:", searchTerms);
    
    let response;
    try {
      response = await $fetch(`${baseUrl}/api/products`, {
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
        categoryName: categoryName,
        isDiscount: item.isDiscount || false
      };
      
      console.log(`Found product: ${product.name} (documentId: ${product.documentId})`);
      return product;
    });
    
    // Если через Strapi ничего не найдено — пробуем другие формы запроса
    if (products.length === 0 && searchTerms.length > 1) {
      // Пробуем второй термин (например, "Яблок" вместо "Яблоки")
      const altMainTerm = searchTerms[1];
      console.log("Retrying with alternative term:", altMainTerm);

      delete params["filters[name][$contains]"];
      params["filters[name][$contains]"] = altMainTerm;

      try {
        const altResponse = await $fetch(`${baseUrl}/api/products`, {
          params,
          headers: { "Content-Type": "application/json" }
        });

        if (altResponse.data && altResponse.data.length > 0) {
          const altProducts = (altResponse.data || []).map((item: any) => {
            let image = "/image/cart-empty-img.png";
            if (item.image) {
              if (Array.isArray(item.image) && item.image.length > 0) {
                image = item.image[0].url || item.image[0].formats?.thumbnail?.url || "/image/cart-empty-img.png";
              } else if (item.image.url) {
                image = item.image.url;
              }
            }
            let cat = "uncategorized";
            let catName = "Без категории";
            if (item.category) {
              if (Array.isArray(item.category) && item.category.length > 0) {
                cat = item.category[0].slug || "uncategorized";
                catName = item.category[0].name || "Без категории";
              } else if (item.category.slug) {
                cat = item.category.slug;
                catName = item.category.name || "Без категории";
              }
            }
            return {
              documentId: item.documentId || item.id,
              name: item.name,
              price: item.price || 0,
              slug: item.slug || item.name.toLowerCase().replace(/ /g, '-'),
              description: item.description || "",
              image,
              category: cat,
              categoryName: catName,
              isDiscount: item.isDiscount || false
            };
          });

          return {
            success: true,
            products: altProducts,
            total: altResponse.meta?.pagination?.total || altProducts.length,
            limit,
            hasMore: false,
            query,
            category
          };
        }
      } catch (altError) {
        console.error("Alt term search error:", altError);
      }
    }

    // Если всё ещё ничего не найдено — пробуем синонимы (картошка → картофель, томат → помидор)
    if (products.length === 0 && query) {
      const { getSynonym } = await import('./product-synonyms');
      const synonym = getSynonym(query);
      if (synonym) {
        const synonymSearch = capitalizeFirst(synonym);
        console.log("Retrying with synonym:", synonymSearch);

        delete params["filters[name][$contains]"];
        params["filters[name][$contains]"] = synonymSearch;

        try {
          const synResponse = await $fetch(`${baseUrl}/api/products`, {
            params,
            headers: { "Content-Type": "application/json" }
          });

          if (synResponse.data && synResponse.data.length > 0) {
            const synProducts = (synResponse.data || []).map((item: any) => {
              let image = "/image/cart-empty-img.png";
              if (item.image) {
                if (Array.isArray(item.image) && item.image.length > 0) {
                  image = item.image[0].url || item.image[0].formats?.thumbnail?.url || "/image/cart-empty-img.png";
                } else if (item.image.url) {
                  image = item.image.url;
                }
              }
              let cat = "uncategorized";
              let catName = "Без категории";
              if (item.category) {
                if (Array.isArray(item.category) && item.category.length > 0) {
                  cat = item.category[0].slug || "uncategorized";
                  catName = item.category[0].name || "Без категории";
                } else if (item.category.slug) {
                  cat = item.category.slug;
                  catName = item.category.name || "Без категории";
                }
              }
              return {
                documentId: item.documentId || item.id,
                name: item.name,
                price: item.price || 0,
                slug: item.slug || item.name.toLowerCase().replace(/ /g, '-'),
                description: item.description || "",
                image,
                category: cat,
                categoryName: catName,
                isDiscount: item.isDiscount || false
              };
            });

            return {
              success: true,
              products: synProducts,
              total: synResponse.meta?.pagination?.total || synProducts.length,
              limit,
              hasMore: false,
              query,
              category
            };
          }
        } catch (synError) {
          console.error("Synonym search error:", synError);
        }
      }
    }

    // Если всё ещё ничего не найдено — пробуем найти по категориям
    if (products.length === 0 && query && searchTerms.length > 0) {
      const mainTerm = searchTerms[0];
      console.log("Fallback: searching categories by name:", mainTerm);

      const fetchCategoryProducts = async (catId: string): Promise<any[]> => {
        const results: any[] = [];

        // Запрос 1: товары с прямой связью category
        const p1 = await $fetch(`${baseUrl}/api/products`, {
          params: {
            "filters[category][documentId][$eq]": catId,
            "pagination[pageSize]": limit,
            "populate": "*",
            "sort": "name:asc",
            "locale": locale || "ru",
            ...(minPrice !== undefined ? { "filters[price][$gte]": minPrice } : {}),
            ...(maxPrice !== undefined ? { "filters[price][$lte]": maxPrice } : {}),
            ...(inStock === true ? { "filters[isAvailable][$eq]": true } : {}),
            ...(isDiscount === true ? { "filters[isDiscount][$eq]": true } : {}),
          },
          headers: { "Content-Type": "application/json" }
        });
        if (p1.data) results.push(...p1.data);

        // Запрос 2: товары, где категория через подкатегорию
        const p2 = await $fetch(`${baseUrl}/api/products`, {
          params: {
            "filters[subcategory][category][documentId][$eq]": catId,
            "pagination[pageSize]": limit,
            "populate": "*",
            "sort": "name:asc",
            "locale": locale || "ru",
            ...(minPrice !== undefined ? { "filters[price][$gte]": minPrice } : {}),
            ...(maxPrice !== undefined ? { "filters[price][$lte]": maxPrice } : {}),
            ...(inStock === true ? { "filters[isAvailable][$eq]": true } : {}),
            ...(isDiscount === true ? { "filters[isDiscount][$eq]": true } : {}),
          },
          headers: { "Content-Type": "application/json" }
        });
        if (p2.data) results.push(...p2.data);

        // Дедупликация по documentId
        const seen = new Set<string>();
        return results.filter(item => {
          const id = item.documentId || item.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      };

      try {
        // Сначала — точное совпадение по имени категории
        const exactResponse = await $fetch(`${baseUrl}/api/categories`, {
          params: {
            "filters[name][$eq]": mainTerm,
            "fields[0]": "documentId",
            "fields[1]": "name",
            "locale": locale || "ru",
            "pagination[pageSize]": 5
          }
        });

        const catResults: any[] = [];
        if (exactResponse.data && exactResponse.data.length > 0) {
          console.log("Exact category match:", exactResponse.data.map((c: any) => c.name));
          for (const cat of exactResponse.data) {
            const items = await fetchCategoryProducts(cat.documentId);
            catResults.push(...items);
          }
        }

        // Если точное совпадение ничего не дало — пробуем $contains
        if (catResults.length === 0) {
          const containsResponse = await $fetch(`${baseUrl}/api/categories`, {
            params: {
              "filters[name][$contains]": mainTerm,
              "fields[0]": "documentId",
              "fields[1]": "name",
              "locale": locale || "ru",
              "pagination[pageSize]": 10
            }
          });

          if (containsResponse.data && containsResponse.data.length > 0) {
            console.log("Contains category match:", containsResponse.data.map((c: any) => c.name));
            for (const cat of containsResponse.data) {
              const items = await fetchCategoryProducts(cat.documentId);
              catResults.push(...items);
            }
          }
        }

        // Дедупликация финального списка
        const seen = new Set<string>();
        const uniqueProducts = catResults.filter(item => {
          const id = item.documentId || item.id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        if (uniqueProducts.length > 0) {
          return {
            success: true,
            products: uniqueProducts.map((item: any) => {
              let image = "/image/cart-empty-img.png";
              if (item.image) {
                if (Array.isArray(item.image) && item.image.length > 0) {
                  image = item.image[0].url || item.image[0].formats?.thumbnail?.url || "/image/cart-empty-img.png";
                } else if (item.image.url) {
                  image = item.image.url;
                }
              }
              let cat = "uncategorized";
              let catName = "Без категории";
              if (item.category) {
                if (Array.isArray(item.category) && item.category.length > 0) {
                  cat = item.category[0].slug || "uncategorized";
                  catName = item.category[0].name || "Без категории";
                } else if (item.category.slug) {
                  cat = item.category.slug;
                  catName = item.category.name || "Без категории";
                }
              } else if (item.subcategory?.category) {
                cat = item.subcategory.category.slug || "uncategorized";
                catName = item.subcategory.category.name || "Без категории";
              }
              return {
                documentId: item.documentId || item.id,
                name: item.name,
                price: item.price || 0,
                slug: item.slug || item.name.toLowerCase().replace(/ /g, '-'),
                description: item.description || "",
                image,
                category: cat,
                categoryName: catName,
                isDiscount: item.isDiscount || false
              };
            }),
            total: uniqueProducts.length,
            limit,
            hasMore: false,
            query,
            category
          };
        }
      } catch (fallbackError) {
        console.error("Category fallback search error:", fallbackError);
      }

      // Если и по категориям ничего нет — пробуем подкатегории
      try {
        const subResponse = await $fetch(`${baseUrl}/api/subcategories`, {
          params: {
            "filters[name][$contains]": mainTerm,
            "fields[0]": "documentId",
            "fields[1]": "name",
            "locale": locale || "ru",
            "pagination[pageSize]": 10
          }
        });

        if (subResponse.data && subResponse.data.length > 0) {
          const subIds = subResponse.data.map((s: any) => s.documentId);
          console.log("Found subcategories:", subResponse.data.map((s: any) => s.name));

          const fallbackParams: Record<string, any> = {
            "pagination[pageSize]": limit,
            "pagination[page]": 1,
            "populate": "*",
            "sort": "name:asc",
            "locale": locale || "ru"
          };

          subIds.forEach((id: string, i: number) => {
            fallbackParams[`filters[subcategory][documentId][$in][${i}]`] = id;
          });

          if (minPrice !== undefined) fallbackParams["filters[price][$gte]"] = minPrice;
          if (maxPrice !== undefined) fallbackParams["filters[price][$lte]"] = maxPrice;
          if (inStock === true) fallbackParams["filters[isAvailable][$eq]"] = true;
          if (isDiscount === true) fallbackParams["filters[isDiscount][$eq]"] = true;

          const subFallbackResponse = await $fetch(`${baseUrl}/api/products`, {
            params: fallbackParams,
            headers: { "Content-Type": "application/json" }
          });

          if (subFallbackResponse.data && subFallbackResponse.data.length > 0) {
            return {
              success: true,
              products: subFallbackResponse.data.map((item: any) => {
                let image = "/image/cart-empty-img.png";
                if (item.image) {
                  if (Array.isArray(item.image) && item.image.length > 0) {
                    image = item.image[0].url || item.image[0].formats?.thumbnail?.url || "/image/cart-empty-img.png";
                  } else if (item.image.url) {
                    image = item.image.url;
                  }
                }
                let cat = "uncategorized";
                let catName = "Без категории";
                if (item.category) {
                  if (Array.isArray(item.category) && item.category.length > 0) {
                    cat = item.category[0].slug || "uncategorized";
                    catName = item.category[0].name || "Без категории";
                  } else if (item.category.slug) {
                    cat = item.category.slug;
                    catName = item.category.name || "Без категории";
                  }
                }
                return {
                  documentId: item.documentId || item.id,
                  name: item.name,
                  price: item.price || 0,
                  slug: item.slug || item.name.toLowerCase().replace(/ /g, '-'),
                  description: item.description || "",
                  image,
                  category: cat,
                  categoryName: catName,
                  isDiscount: item.isDiscount || false
                };
              }),
              total: subFallbackResponse.meta?.pagination?.total || 0,
              limit,
              hasMore: false,
              query,
              category
            };
          }
        }
      } catch (fallbackError) {
        console.error("Subcategory fallback search error:", fallbackError);
      }
    }

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