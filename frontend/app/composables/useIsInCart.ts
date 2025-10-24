export const useIsInCart = () => {
   const cartStore = useCartStore()

   const cartProductIds = computed<Set<string | number>>(() => 
      new Set(cartStore.items.map(item => item.product.id))
    )
    
    const isInCart = (productId: number) => 
      cartProductIds.value.has(productId)

   return { isInCart }
}