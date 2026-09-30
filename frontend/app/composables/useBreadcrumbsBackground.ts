/**
 * Фон хлебных крошек из `global.breadcrumbs.background` (компонент
 * background.background-image: webp 1x + avif 2x). Используется страницами,
 * которые передают фон в `UBreadcrumbs` (например, страница товаров и растения).
 */
export const useBreadcrumbsBackground = () => {
  const { currentLocale } = useLocale();
  const { find } = useStrapi();

  const { data } = useCachedAsyncData(
    `breadcrumbs-global-${currentLocale.value}`,
    async () => {
      const response: any = await find("global", {
        filters: { locale: { $eq: currentLocale.value } },
        fields: ["id"],
        populate: {
          breadcrumbs: {
            populate: {
              background: {
                populate: {
                  baseBgImageWebp: { fields: ["url"] },
                  retinaBgImageAvif: { fields: ["url"] },
                },
              },
            },
          },
        },
      } as any);
      return response?.data ?? null;
    },
    { ttl: 600_000 },
  );

  // global — single type: Content API возвращает data как объект (не массив)
  return computed(() => {
    const global = data.value as any;
    const bc = Array.isArray(global) ? global[0]?.breadcrumbs : global?.breadcrumbs;
    return bc?.background ?? null;
  });
};
