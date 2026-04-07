export const useIsInCart = () => {
   const cartStore = useCartStore()

   const cartProductIds = computed<Set<string>>(() => 
      new Set(cartStore.items.map(item => item.product.documentId))
    )
    
    const isInCart = (productId: string) => 
      cartProductIds.value.has(productId)

   return { isInCart }
}