import { onMounted, onUnmounted } from "vue"

export interface UseDialogOptions {
  useShowMethod?: boolean; // Если true, используем show() вместо showModal()
  initialOpen?: boolean;   // Начальное состояние isOpen (для диалогов, открытых по умолчанию при SSR)
}

// Универсальный возвращаемый тип
interface UseDialogReturn {
  open?: () => void;
  close?: () => void;
  isOpen: Ref<boolean>;
}

export const useDialog = (
  id: string,
  dialogElement?: Ref<HTMLDialogElement | null>,
  options: UseDialogOptions = {},
): UseDialogReturn => {
  const { useShowMethod = false, initialOpen = false } = options;

  // SSR-safe общее состояние по id: useState — на СЕРВЕРЕ состояние per-request
  // (module-Map протекал между запросами: после SSR /ru/products isOpen оставался
  // true и главная рендерилась со скрытой шапкой), на КЛИЕНТЕ — единое,
  // передаётся через payload.
  const isOpen = useState<boolean>(`dialog-${id}`, () => Boolean(initialOpen));

  // Если dialogElement не передан, возвращаем только isOpen
  if (!dialogElement) {
    return { isOpen };
  }

  // ВАЖНО: open()/close() работают с ЛОКАЛЬНЫМ dialogElement этого вызова,
  // а не с глобальным реестром. Раньше (dialogElementMap по id) при двух
  // инстансах с одним id (ShowHamburger desktop/mobile) последний зарегистрированный
  // элемент перезаписывал первый — desktop-кнопка открывала скрытый mobile-диалог.
  const getElement = () => dialogElement.value;

  const open = () => {
    const el = getElement();
    if (el) {
      if (useShowMethod) {
        el.show();
      } else {
        el.showModal();
      }
    }
    isOpen.value = true;
  };

  const close = () => {
    const el = getElement();
    el?.close?.();
    isOpen.value = false;
  };

  // Обработчик клика на бэкдроп - только для showModal()
  const closeOnBackdropClick = (e: MouseEvent) => {
    const el = getElement();
    if (!el) return;
    if (e.target === el) {
      close();
    }
  };

  // Обработчик Escape - для show() (show() не обрабатывает Escape нативно)
  const closeOnEscape = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    // Guard по isOpen: Escape закрывает только открытый диалог
    if (isOpen.value) close();
  };

  // Добавление обработчика событий
  onMounted(() => {
    const el = getElement();
    if (!el) return;

    if (useShowMethod) {
      // Для show() слушатель на document в capture-фазе: фокус не передаётся
      // внутрь диалога, поэтому keydown на самом элементе ловил Escape только
      // при фокусе внутри. document ловит Escape откуда угодно.
      document.addEventListener("keydown", closeOnEscape, true);
    } else {
      el.addEventListener("click", closeOnBackdropClick);
    }
  });

  // Удаление обработчика при размонтировании
  onUnmounted(() => {
    const el = getElement();
    if (!el) return;

    if (useShowMethod) {
      document.removeEventListener("keydown", closeOnEscape, true);
    } else {
      el.removeEventListener("click", closeOnBackdropClick);
    }
  });

  return {
    open,
    close,
    isOpen,
  };
};
