export const useOrderStore = defineStore('order', () => {
   const { create } = useStrapi()
   const cartStore = useCartStore()
   const authStore = useAuthStore()

   const createOrder = async (email: string, phone: string) => {
      try {
         const orderItems = cartStore.items.map((item: any) => ({
            productId: item.product.documentId,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image || '',
            categorySlug: item.product.categorySlug,
            subcategorySlug: item.product.subcategorySlug || null,
         }))

         const orderData: Record<string, any> = {
            items: orderItems,
            total: cartStore.totalPrice,
            email,
            phone,
            statusOrders: 'new',
         }

         // Если пользователь авторизован — привязываем заказ к его аккаунту
         if (authStore.isAuthenticated && authStore.user?.documentId) {
            orderData.user = authStore.user.documentId
         }

         const response = await create('orders', orderData)
         cartStore.clearCart()
         return response
      } catch (error) {
         console.error('Error creating order:', error)
         throw error
      }
   }

   return {createOrder}
})
