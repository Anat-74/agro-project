export const useIsInCart = () => {
   const cartStore = useCartStore()

   const cartIds = computed(() =>
     new Set(cartStore.items.map(item => item.product.documentId))
   )

   const isInCart = (productId: string) =>
     cartIds.value.has(productId)

   return { isInCart }
}