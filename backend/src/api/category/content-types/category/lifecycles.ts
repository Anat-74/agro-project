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
    "name": category.seoTitle || category.name || 'Категория',
    "description": category.seoDescription || category.name || 'Описание категории',
    "url": `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${category.locale || 'ru'}/${category.slug || 'category'}`,
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
  };

  return structuredData;
}