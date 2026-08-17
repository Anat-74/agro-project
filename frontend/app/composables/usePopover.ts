import { ref, onMounted, onUnmounted } from "vue";

// Универсальный возвращаемый тип
interface UsePopoverReturn {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: Ref<boolean>;
}

// Глобальное состояние по ID (по аналогии с useDialog)
const isOpenMap = new Map<string, Ref<boolean>>();
const popoverElementMap = new Map<string, Ref<HTMLElement | null>>();

/**
 * Композабл для Popover API (аналог useDialog для диалогов).
 * Режим (auto/manual) задаётся атрибутом popover на самом элементе:
 *  - `popover` (auto) — нативный light-dismiss (клик вне/Escape);
 *  - `popover="manual"` — закрытие только явное (ховер/кастомное управление).
 */
export const usePopover = (
  id: string,
  popoverElement?: Ref<HTMLElement | null>,
): UsePopoverReturn => {
  // Если элемент не передан, возвращаем только isOpen (чтение состояния по ID)
  if (!popoverElement) {
    if (isOpenMap.has(id)) {
      return { open: () => {}, close: () => {}, toggle: () => {}, isOpen: isOpenMap.get(id)! };
    }
    const isOpen = ref(false);
    isOpenMap.set(id, isOpen);
    return { open: () => {}, close: () => {}, toggle: () => {}, isOpen };
  }

  const isOpen = isOpenMap.has(id) ? isOpenMap.get(id)! : ref(false);
  isOpenMap.set(id, isOpen);
  popoverElementMap.set(id, popoverElement);

  const open = () => {
    const el = popoverElement.value;
    if (!el) return;
    try {
      el.showPopover();
      isOpen.value = true;
    } catch {
      // Поповер нельзя показать (например display: none — скрыт на мобильном) — молча игнорируем
    }
  };

  const close = () => {
    popoverElement.value?.hidePopover();
    isOpen.value = false;
  };

  const toggle = () => {
    if (popoverElement.value?.matches(":popover-open")) close();
    else open();
  };

  // Синхронизация isOpen с реальным состоянием поповера (в т.ч. при нативном закрытии auto)
  const sync = () => {
    const el = popoverElement.value;
    if (el) isOpen.value = el.matches(":popover-open");
  };

  onMounted(() => {
    const el = popoverElement.value;
    if (!el) return;
    el.addEventListener("toggle", sync);
    sync();
  });

  onUnmounted(() => {
    popoverElement.value?.removeEventListener("toggle", sync);
  });

  return { open, close, toggle, isOpen };
};
