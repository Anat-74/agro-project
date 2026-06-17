import { ref, onMounted, onUnmounted } from "vue"

export interface UseDialogOptions {
  useShowMethod?: boolean; // Если true, используем show() вместо showModal()
}

// Глобальное состояние для хранения isOpen по ID
const isOpenMap = new Map<string, Ref<boolean>>();
// Глобальное состояние для хранения dialogElement по ID
const dialogElementMap = new Map<string, Ref<HTMLDialogElement | null>>();
// Глобальное состояние для хранения options по ID
const optionsMap = new Map<string, UseDialogOptions>();

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
  const { useShowMethod = false } = options;

  // Если dialogElement не передан, возвращаем только isOpen
  if (!dialogElement) {
    // Если состояние для этого ID уже существует, возвращаем его
    if (isOpenMap.has(id)) {
      return { isOpen: isOpenMap.get(id)! };
    }

    // Иначе создаем новое состояние
    const isOpen = ref(false);
    isOpenMap.set(id, isOpen);
    return { isOpen };
  }

  // Если dialogElement передан, регистрируем диалог
  const isOpen = isOpenMap.has(id) ? isOpenMap.get(id)! : ref(false);
  isOpenMap.set(id, isOpen);
  dialogElementMap.set(id, dialogElement);
  optionsMap.set(id, { useShowMethod });

  const open = () => {
    const storedElement = dialogElementMap.get(id)?.value;
    const storedOptions = optionsMap.get(id);

    if (storedElement) {
      if (storedOptions?.useShowMethod) {
        storedElement.show();
      } else {
        storedElement.showModal();
      }
    }
    isOpen.value = true;
  };

  const close = () => {
    const storedElement = dialogElementMap.get(id)?.value;
    if (storedElement) {
      storedElement.close?.();
    }
    isOpen.value = false;
  };

  // Обработчик клика на бэкдроп - только для showModal()
  const closeOnBackdropClick = (e: MouseEvent) => {
    const storedElement = dialogElementMap.get(id)?.value;
    if (!storedElement) return;
    if (e.target === storedElement) {
      close();
    }
  };

  // Обработчик Escape - для show() (show() не обрабатывает Escape нативно)
  const closeOnEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };

  // Добавление обработчика событий
  onMounted(() => {
    const storedElement = dialogElementMap.get(id)?.value;
    if (!storedElement) return;

    if (useShowMethod) {
      storedElement.addEventListener("keydown", closeOnEscape);
    } else {
      storedElement.addEventListener("click", closeOnBackdropClick);
    }
  });

  // Удаление обработчика при размонтировании
  onUnmounted(() => {
    const storedElement = dialogElementMap.get(id)?.value;
    if (!storedElement) return;

    if (useShowMethod) {
      storedElement.removeEventListener("keydown", closeOnEscape);
    } else {
      storedElement.removeEventListener("click", closeOnBackdropClick);
    }
  });

  return {
    open,
    close,
    isOpen,
  };
};
