/**
 * Запрос на переключение мобильной панели-гамбургера (владелец — AppHeader).
 *
 * Кнопка-гамбургер может жить вне шапки (например, в крошках страницы товаров,
 * где при открытом фильтре шапка сайта скрыта). Здесь — разделяемый счётчик
 * запросов: владелец (AppHeader) слушает его и переключает СВОЙ экземпляр
 * ShowHamburger. Компонент НЕ дублируется, данные (global) не грузятся повторно.
 */
export const useHamburgerDialog = () => {
  const requestId = useState<number>("hamburger-dialog-request", () => 0);

  const requestToggle = () => {
    requestId.value += 1;
  };

  return { requestId, requestToggle };
};
