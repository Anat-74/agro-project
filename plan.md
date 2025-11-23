# План исправления ошибки "Cannot read properties of undefined (reading 'message')" в Nuxt приложении

## Проблема
При запуске `npm run dev` возникает ошибка:
```
ERROR  [unhandledRejection] Cannot read properties of undefined (reading 'message')
at createError (/C:/agro-project/frontend/node_modules/h3/dist/index.mjs:71:33)
at createError (node_modules\nuxt\dist\app\composables\error.js:42:58)
at node_modules\nuxt\dist\app\composables\asyncData.js:376:70
```

## Причина
Проблема связана с lifecycle-хуками в Strapi для коллекций Category, Subcategory и Product, которые были добавлены для генерации SEO-данных. В этих хуках:

1. Используется переменная `process.env.FRONTEND_URL`, которая не определена в .env файле backend
2. Нет проверок на существование свойств перед их использованием
3. Возможны ошибки при обращении к вложенным свойствам, которые могут быть undefined

## Решение

### 1. Исправить файл `backend/src/api/category/content-types/category/lifecycles.ts`

Необходимо:
- Добавить проверки на существование свойств перед их использованием
- Заменить `process.env.FRONTEND_URL` на путь, основанный на URL-адресе приложения
- Обернуть генерацию structured data в проверки на существование данных

### 2. Исправить файл `backend/src/api/subcategory/content-types/subcategory/lifecycles.ts`

Необходимо:
- Добавить проверки на существование свойств перед их использованием
- Заменить `process.env.FRONTEND_URL` на путь, основанный на URL-адресе приложения
- Обернуть генерацию structured data в проверки на существование данных

### 3. Исправить файл `backend/src/api/product/content-types/product/lifecycles.ts`

Необходимо:
- Добавить проверки на существование свойств перед их использованием
- Убедиться, что при обновлении structuredData все необходимые свойства существуют

## Конкретные изменения

### Для файла category/lifecycles.ts:
```typescript
export default {
  async beforeCreate(event: any) {
    const { data } = event.params;

    // Генерация structuredData при создании категории
    if (data.name) {
      data.seo = {
        metaTitle: data.seoTitle || data.name,
        metaDescription: data.seoDescription || data.name,
        structuredData: generateStructuredData(data)
      };
    }
  },

  async beforeUpdate(event: any) {
    const { data } = event.params;

    // Генерация structuredData при обновлении категории
    if (data.name) {
      data.seo = {
        metaTitle: data.seoTitle || data.name,
        metaDescription: data.seoDescription || data.name,
        structuredData: generateStructuredData(data)
      };
    }
  }
};

// Функция генерации structured data для категории
function generateStructuredData(category: any) {
  // Проверяем наличие необходимых свойств
  if (!category) return null;
  
  // Базовая структура для категории
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.seoTitle || category.name,
    "description": category.seoDescription || category.name,
    "url": `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${category.locale || 'en'}/${category.slug || 'default'}`,
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
  };

  return structuredData;
}
```

### Для файла subcategory/lifecycles.ts:
```typescript
export default {
  async beforeCreate(event: any) {
    const { data } = event.params;

    // Генерация structuredData при создании подкатегории
    if (data.name) {
      data.seo = {
        metaTitle: data.seoTitle || data.name,
        metaDescription: data.seoDescription || data.name,
        structuredData: generateStructuredData(data)
      };
    }
  },

  async beforeUpdate(event: any) {
    const { data } = event.params;

    // Генерация structuredData при обновлении подкатегории
    if (data.name) {
      data.seo = {
        metaTitle: data.seoTitle || data.name,
        metaDescription: data.seoDescription || data.name,
        structuredData: generateStructuredData(data)
      };
    }
  }
};

// Функция генерации structured data для подкатегории
function generateStructuredData(subcategory: any) {
  // Проверяем наличие необходимых свойств
 if (!subcategory) return null;
  
  // Базовая структура для подкатегории
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": subcategory.seoTitle || subcategory.name,
    "description": subcategory.seoDescription || subcategory.name,
    "url": `${process.env.FRONTEND_URL || 'http://localhost:300'}/${subcategory.locale || 'en'}/${subcategory.category?.slug || 'category'}/${subcategory.slug || 'default'}`,
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
  };

  return structuredData;
}
```

### Для файла product/lifecycles.ts:
```typescript
export default {
  async beforeCreate(event) {
    const { data } = event.params;

    // Проверяем наличие необходимых свойств
    if (!data) return;

    // Автозаполнение SEO если не заполнено
    if (!data.seo?.metaTitle) {
      data.seo = {
        ...data.seo,
        metaTitle: `Купить ${data.name} | ТехноМарс`,
        metaDescription: `${data.name} в магазине ТехноМарс. ${data.description?.substring(0, 150) || ''} Гарантия качества.`
      };
    }

    // Автогенерация structuredData
    if (!data.seo?.structuredData) {
      data.seo = {
        ...data.seo,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data.name,
          "description": data.description?.substring(0, 150) || data.name,
          "offers": {
            "@type": "Offer",
            "price": data.price?.toString(),
            "priceCurrency": "RUB",
            "availability": data.isAvailable ?
              "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }
      };
    }
  },

  // ТАКЖЕ ДЛЯ ОБНОВЛЕНИЯ!
  async beforeUpdate(event) {
    const { data } = event.params;

    // Проверяем наличие необходимых свойств
    if (!data || !data.seo?.structuredData) return;

    // При обновлении цены/наличия - обновляем structuredData
    if (data.price || data.isAvailable !== undefined) {
      if (data.seo?.structuredData) {
        data.seo.structuredData.offers = {
          ...data.seo.structuredData.offers,
          price: data.price?.toString() || data.seo.structuredData.offers.price,
          availability: data.isAvailable !== undefined ?
            (data.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock")
            : data.seo.structuredData.offers.availability
        };
      }
    }
  }
};
```

## Дополнительные проверки

Также нужно убедиться, что в frontend компонентах правильно обрабатываются случаи, когда structuredData может быть null или undefined.