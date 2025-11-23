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
    "name": subcategory.seoTitle || subcategory.name || 'Подкатегория',
    "description": subcategory.seoDescription || subcategory.name || 'Описание подкатегории',
    "url": `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${subcategory.locale || 'ru'}/${subcategory.category?.slug || 'category'}/${subcategory.slug || 'subcategory'}`,
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
  };

  return structuredData;
}