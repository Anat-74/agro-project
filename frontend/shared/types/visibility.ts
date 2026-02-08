export interface VisibilityState {
  isContacts: Ref<boolean>;
  visibleIsContacts: () => void;
  hideContacts: () => void;
}
