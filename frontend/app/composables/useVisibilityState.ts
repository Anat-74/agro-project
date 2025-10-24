import type { VisibilityState } from "@/types/types"

const VISIBILITY_KEY = "visible"

export const useVisibilityProvider = () => {
//   const isAccount = ref<boolean>(false)
  const isContacts = ref<boolean>(false)

//   const visibleIsAccount = () => (isAccount.value = true)
  const visibleIsContacts = () => (isContacts.value = true)

  const state: VisibilityState = {
   //  isAccount,
    isContacts,
   //  visibleIsAccount,
    visibleIsContacts,
  }

  provide(VISIBILITY_KEY, state)

  return state
}

export const useVisibilityConsumer = (): VisibilityState => {
  const state = inject<VisibilityState>(VISIBILITY_KEY)

  if (!state) {
    throw new Error("Visibility state must be provided before consumption")
  }

  return state
}
