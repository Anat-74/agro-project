export const VISIBILITY_KEY = "visible" as const;

export interface VisibilityState {
  isContacts: Ref<boolean>;
  visibleIsContacts: () => void;
  hideContacts: () => void;
}
