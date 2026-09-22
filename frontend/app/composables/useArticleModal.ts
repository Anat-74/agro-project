// Общая логика для клика по статье блога.
//
// Задача: на телефоне и планшете (до 1024 точек) открывать модальное окно вместо
// перехода на страницу статьи, а на десктопе оставить обычный переход.
//
// Важно: ссылка остаётся настоящей (её видят поисковые системы). Чтобы NuxtLink
// не увёл пользователя на страницу, клик перехватываем на родителе (li) в фазе
// «перехвата» и останавливаем событие — NuxtLink проверяет только preventDefault
// и всё равно выполнил бы переход, поэтому нужен именно stopPropagation.
export interface ArticleLinkItem {
  // Поля необязательные: данные приходят из Strapi, где slug/заголовок могут
  // быть пустыми — тогда переход по ссылке не перехватываем
  slug?: string | null;
  title?: string | null;
  date?: string | null;
}

export const useArticleModal = () => {
  const { width } = useViewport();
  const activeArticle = ref<ArticleLinkItem | null>(null);

  const isTouchViewport = () => Boolean(width.value && width.value <= 1024);

  // Возвращает true, если клик перехвачен — значит нужно открыть модальное окно
  const interceptArticleClick = (item: ArticleLinkItem, event: MouseEvent) => {
    if (!isTouchViewport() || !item.slug) return false;

    event.stopPropagation();
    event.preventDefault();
    activeArticle.value = {
      slug: item.slug,
      title: item.title ?? "",
      date: item.date ?? null,
    };
    return true;
  };

  return { activeArticle, interceptArticleClick, isTouchViewport };
};
