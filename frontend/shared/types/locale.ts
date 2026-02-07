import type { Ref } from "vue";

export type LocaleCode = "ru" | "be";

export interface VisibilityState {
  // isAccount: Ref<boolean>
  isContacts: Ref<boolean>;
  // visibleIsAccount: () => void;
  visibleIsContacts: () => void;
  hideContacts: () => void;
}
