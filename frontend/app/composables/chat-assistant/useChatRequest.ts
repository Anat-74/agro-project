/**
 * Глобальный запрос на открытие чата с контекстом раздела.
 *
 * Используется кнопками «Спросить AI» из разделов («Посадка»/«Заготовки»):
 * кнопка вызывает requestChat({ section, item }), а ChatAssistant (в шапке)
 * открывается и передаёт контекст в API, чтобы ответ опирался на нужный раздел.
 */

export interface ChatRequestContext {
  /** id раздела-калькулятора: garden | preserves */
  section?: string;
  /** Название выбранного элемента (растение / продукт заготовки) */
  item?: string;
}

interface ChatRequest {
  open: boolean;
  context?: ChatRequestContext;
}

export function useChatRequest() {
  const request = useState<ChatRequest>("chat-request", () => ({ open: false }));

  const requestChat = (context?: ChatRequestContext) => {
    request.value = { open: true, context };
  };

  const consumeRequest = () => {
    const current = request.value;
    request.value = { open: false };
    return current;
  };

  return { request, requestChat, consumeRequest };
}

export type UseChatRequestReturn = ReturnType<typeof useChatRequest>;
