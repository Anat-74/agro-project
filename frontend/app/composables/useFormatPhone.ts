export const useFormatPhone = () => {
   const formatPhone = (phone: string) => {
     return phone
       .replace(/ /g, '\u00A0')   // Неразрывный пробел (U+00A0)
       .replace(/-/g, '\u2011')   // Неразрывный дефис (U+2011)
   }
   return { formatPhone }
 }