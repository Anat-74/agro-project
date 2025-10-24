import type { LocaleCode } from "../types/types"

export const seoTranslations: Record<LocaleCode, {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
}> = {
  ru: {
    title: 'ТехноМарс - Сейфы, металлические шкафы, стеллажи и другая продукция',
    description: 'Продажа сейфов, металлических шкафов, стеллажей и другой продукции в Беларуси. Гарантия качества, доставка по Минску и всей стране.',
    ogTitle: 'ТехноМарс - Сейфы, металлические шкафы, стеллажи',
    ogDescription: 'Широкий выбор сейфов, металлических шкафов, стеллажей и другой продукции по лучшим ценам'
  },
  en: {
    title: 'TechnoMars - Safes, Metal Cabinets, Shelving and Other Products',
    description: 'Safes, metal cabinets, shelving and other products in Belarus. Quality guarantee, delivery in Minsk and throughout the country.',
    ogTitle: 'TechnoMars - Safes, Metal Cabinets, Shelving',
    ogDescription: 'Wide selection of safes, metal cabinets, shelving and other products at the best prices'
  },
  be: {
    title: 'ТэхноМарс - Сейфы, металічныя шафы, стэлажы, а так-жа іншая прадукцыя',
    description: 'Продаж сейфаў, металічных шаф, стэлажоў, а так-жа іншая прадукцыя ў Беларусі. Гарантыя якасці, дастаўка па Мінску, а так-жа па ўсёй краіне.',
    ogTitle: 'ТэхноМарс - Сейфы, металічныя шафы, стэлажы',
    ogDescription: 'Шырокі выбар сейфаў, металічных шаф, стэлажоў, а так-жа іншая прадукцыя па лепшых цанах'
  }
}