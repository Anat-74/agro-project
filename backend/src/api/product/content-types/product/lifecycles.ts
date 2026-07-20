export default {
  async beforeCreate(event) {
    const { data } = event.params;

    // Проверяем наличие необходимых свойств
    if (!data) return;

    // Автозаполнение SEO если не заполнено
    if (!data.seo?.metaTitle) {
      data.seo = {
        ...data.seo,
        metaTitle: `Купить ${data.name || 'товар'} | АгроМаркет`,
        metaDescription: `${data.name || 'товар'} в магазине АгроМаркет. ${data.description?.substring(0, 150) || ''} Гарантия качества.`
      };
    }

    // Автогенерация structuredData
    if (!data.seo?.structuredData) {
      data.seo = {
        ...data.seo,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data.name || 'Товар',
          "description": data.description?.substring(0, 150) || data.name || 'Описание товара',
          "url": `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${data.locale || 'ru'}/${data.category?.slug || 'category'}/${data.subcategory?.slug || 'subcategory'}/${data.slug || 'product'}`,
          "offers": {
            "@type": "Offer",
            "price": data.price?.toString() || '0',
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
          price: data.price?.toString() || data.seo.structuredData.offers.price || '0',
          availability: data.isAvailable !== undefined ?
            (data.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock")
            : data.seo.structuredData.offers.availability
        };
      }
    }
    
    // Также обновляем URL, если изменились slug или категории
    if (data.slug || data.category?.slug || data.subcategory?.slug) {
      if (data.seo?.structuredData) {
        data.seo.structuredData.url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${data.locale || 'ru'}/${data.category?.slug || 'category'}/${data.subcategory?.slug || 'subcategory'}/${data.slug || 'product'}`;
      }
    }
  }
};
