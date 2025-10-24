export const formatPrice = (price: number | string) => {
   const numericPrice = typeof price === 'string' ? parseFloat(price) : price
   
   return new Intl.NumberFormat('ru-RU', {
     style: 'decimal',
     minimumFractionDigits: 2,
     maximumFractionDigits: 2
   }).format(numericPrice)
 }