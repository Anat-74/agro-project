import { defineStore } from "pinia"
import { ref, computed } from "vue"

export type CartProduct = Omit<Product, 'image' | 'mainImage'> & {
   mainImage: string
   categorySlug: string
   subcategorySlug: string | null
   originalLocale: string
   documentId: string
 }
 
 export type CartItem = {
   product: CartProduct
   quantity: number
 }

export const useCartStore = defineStore('cart', () => {
   const { currentLocale } = useLocale()
   const items = ref<CartItem[]>([])

   // Валидация против Strapi выполняется один раз за сессию (корзина в SPA
   // живёт в сторе; новые позиции добавляются из живых данных каталога)
   let cartValidated = false

   const totalItems = computed(() =>
      items.value.reduce((total, item) => total + item.quantity, 0)
   )

   const totalPrice = computed(() =>
      items.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    )

   const addToCart = (
      product: Product,
      categorySlug: string,
      subcategorySlug: string | null = null
    ) => {
      const existingItem = items.value.find(item => item.product.documentId === product.documentId)
      
      const normalizedMainImage = product.mainImage?.url
        || (typeof product.image === 'string'
          ? product.image
          : Array.isArray(product.image)
            ? product.image[0]?.url || ''
            : '')
  
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        items.value.push({
          product: {
            ...product,
            mainImage: normalizedMainImage,
            categorySlug,
            subcategorySlug,
            originalLocale: currentLocale.value // Сохраняем язык добавления
          },
          quantity: 1
        })
      }
      saveCart()
    }

   const removeFromCart = (productId: string) => {
      items.value = items.value.filter(item => item.product.documentId !== productId)
      saveCart()
   }

   const updateQuantity = (productId: string, quantity: number) => {
      const item = items.value.find(item => item.product.documentId === productId)
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
          typeof item.product.documentId === 'string'
 }

    const loadCart = async () => {
       if (typeof window === 'undefined') return; // Для SSR
       const savedCart = localStorage.getItem('cart')
       if (!savedCart) return
       let parsed: unknown
       try {
         parsed = JSON.parse(savedCart)
       } catch (e) {
         console.error("Ошибка загрузки:", e)
         localStorage.removeItem('cart')
         return
       }
       const loaded = Array.isArray(parsed) ? parsed.filter(isCartItem) : []
       if (loaded.length === 0) {
         items.value = []
         return
       }
       if (cartValidated) {
         items.value = loaded
         return
       }
       // Перепроверяем товары в Strapi: позиции, чьи товары были удалены из
       // каталога, убираем из корзины — иначе остаются «битые» ссылки на
       // изображения (404) и переходы на несуществующие страницы.
       try {
         const { find } = useStrapi()
         const ids = [...new Set(loaded.map(i => i.product.documentId))]
         const response = await find<{ documentId: string }>('products', {
           filters: { documentId: { $in: ids } },
           fields: ['documentId'],
           pagination: { pageSize: 100 },
         } as any)
         const existing = new Set((response?.data || []).map(p => p.documentId))
         const valid = loaded.filter(i => existing.has(i.product.documentId))
         items.value = valid
         if (valid.length !== loaded.length) saveCart() // чистим localStorage от осиротевших
         cartValidated = true
       } catch {
         // Strapi недоступен — показываем сохранённую корзину как есть
         items.value = loaded
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