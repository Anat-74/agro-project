/**
 * Запрос на открытие диалога корзины из любого компонента.
 *
 * Сам <dialog> живёт в AppHeader (владелец инстанса), поэтому здесь только
 * разделяемый счётчик запросов: владелец слушает его и открывает свой диалог.
 * Так кнопка корзины в дровере открывает модалку, а не страницу /cartshopping
 * (страница корзины — только для экранов выше tablet).
 */
export const useCartDialog = () => {
  const requestId = useState<number>("cart-dialog-request", () => 0);

  const requestOpen = () => {
    requestId.value += 1;
  };

  return { requestId, requestOpen };
};
