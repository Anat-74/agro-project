export const useOrderStore = defineStore('order', () => {
   const { create } = useStrapi()
   const cartStore = useCartStore()

   const createOrder = async (email: string, phone: string) => {
      try {
         const orderData = {
            items: cartStore.items,
            total: cartStore.totalPrice,
            email,
            phone,
            statusOrders: 'new'
         }

         const response = await create('orders', orderData)
         cartStore.clearCart()
         return response
      } catch (error) {
         console.error('Ошибка при создании заказа:', error)
         throw error
      }
   }
   return {createOrder}
})