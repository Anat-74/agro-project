/**
 * Запрос на открытие панели каталога на вкладке «Посадка».
 *
 * Сама панель (мобильный оверлей ≤ $tablet) живёт в AppHeader, поэтому здесь
 * только разделяемый счётчик запросов: владелец слушает его и открывает панель
 * на нужном слайде. Нужен, чтобы на мобильном не уводить пользователя на
 * отдельную страницу (CTA «Рассчитать посадку» в статье открывает диалог).
 */
export const useGardenDialog = () => {
  const requestId = useState<number>("garden-dialog-request", () => 0);

  const requestOpen = () => {
    requestId.value += 1;
  };

  return { requestId, requestOpen };
};
