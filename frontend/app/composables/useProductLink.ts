export const useProductLink = () => {
  const { currentLocale } = useLocale();

  // Функция для формирования URL продукта с учетом связи с категорией или подкатегорией
  const getProductLink = (product: Product) => {
    if (product.subcategory?.slug) {
      // Продукт связан с подкатегорией
      // Берем категорию из subcategory.category, так как product.category может быть undefined
      const categorySlug =  product.subcategory.category?.slug || product.category?.slug;
      return `/${currentLocale.value}/${categorySlug}/${product.subcategory.slug}/${product.slug}`;
    } else if (product.category?.slug) {
      // Продукт связан с категорией напрямую
      return `/${currentLocale.value}/${product.category.slug}/products/${product.slug}`;
    }
    return `/${currentLocale.value}`;
  };

  return { getProductLink };
};
