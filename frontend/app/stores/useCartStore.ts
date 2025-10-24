import type { Product } from "../types/types"

export type CartProduct = Omit<Product, 'image'> & {
   image: string
   categorySlug: string
   subcategorySlug: string
   originalLocale: string
 }
 
 export type CartItem = {
   product: CartProduct
   quantity: number
 }

export const useCartStore = defineStore('cart', () => {
   const { currentLocale } = useLocale()
   const items = ref<CartItem[]>([])

   const totalItems = computed(() => 
      items.value.reduce((total, item) => total + item.quantity, 0)
   )

   const totalPrice = computed(() => 
      items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    )

   const addToCart = (
      product: Product,
      categorySlug: string,
      subcategorySlug: string
    ) => {
      const existingItem = items.value.find(item => item.product.id === product.id)
      
      // Нормализация изображения
      const normalizedImage = typeof product.image === 'string' 
        ? product.image 
        : Array.isArray(product.image) 
          ? product.image[0]?.url || ''
          : ''
  
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        items.value.push({
          product: {
            ...product,
            image: normalizedImage,
            categorySlug,
            subcategorySlug,
            originalLocale: currentLocale.value // Сохраняем язык добавления
          },
          quantity: 1
        })
      }
      saveCart()
    }

   const removeFromCart = (productId: number) => {
      items.value = items.value.filter(item => item.product.id !== productId)
      saveCart()
   }

   const updateQuantity = (productId: number, quantity: number) => {
      const item = items.value.find(item => item.product.id === productId)
      if (item) {
        const newQuantity = Math.max(1, quantity)
        item.quantity = newQuantity
        saveCart()
      }
    }

   const clearCart = () => {
      items.value = []
      saveCart()
   }

   const saveCart = () => {
      localStorage.setItem('cart', JSON.stringify(items.value))
   }

   // Функция-предикат для проверки структуры данных
const isCartItem = (item: any): item is CartItem => {
   return item && 
          typeof item.quantity === 'number' &&
          item.product &&
          typeof item.product.id === 'number'
 }

   const loadCart = () => {
      if (typeof window === 'undefined') return; // Для SSR
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
         try {
          const parsed = JSON.parse(savedCart)
            if (Array.isArray(parsed)) {
               items.value = parsed.filter(isCartItem);
          }
        } catch (e) {
          console.error("Ошибка загрузки:", e)
          localStorage.removeItem('cart')
        }
      }
   }

   return {
      items,
      totalItems,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      loadCart
    }
})