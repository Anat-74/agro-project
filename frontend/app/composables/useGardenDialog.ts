/**
 * Запрос на открытие панели каталога на слайде калькулятора («Посадка» или
 * «Заготовки»).
 *
 * Сама панель (мобильный оверлей ≤ $tablet) живёт в AppHeader, поэтому здесь
 * только разделяемый счётчик запросов: владелец слушает его и открывает панель
 * на нужном слайде. Нужен, чтобы на мобильном не уводить пользователя на
 * отдельную страницу (CTA «Рассчитать посадку/заготовку» открывает диалог).
 */
export type CalcSlideId = "garden" | "preserves";

export const useCalcDialog = (slide: CalcSlideId) => {
  const requestId = useState<number>(`calc-dialog-request-${slide}`, () => 0);

  const requestOpen = () => {
    requestId.value += 1;
  };

  return { requestId, requestOpen };
};

/** Панель на слайде «Посадка» */
export const useGardenDialog = () => useCalcDialog("garden");

/** Панель на слайде «Заготовки» */
export const usePreservesDialog = () => useCalcDialog("preserves");
