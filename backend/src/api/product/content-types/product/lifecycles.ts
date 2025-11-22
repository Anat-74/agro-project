export default {
  async beforeCreate(event) {
    const { data } = event.params;

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
