import type { LocaleCode } from "../types/types"

export const seoTranslations: Record<LocaleCode, {
  title: string
  description: string
  ogTitle: string
  ogDescription: string
}> = {
  ru: {
    title: 'Органик - свежие органические продукты',
    description: 'Свежие сельхоз-продукты Доступные агропродукты в Минской области',
    ogTitle: 'ТехноМарс - Всегда свежие органические продукты',
    ogDescription: 'Свежие сельхоз-продукты Агропродукты всегда в наличии'
  },
  be: {
    title: 'Органік - Сейфы, металічныя шафы, стэлажы, а так-жа іншая прадукцыя',
    description: 'Свежыя сельгас-прадукты Даступныя аграпрадукты ў Мінскай вобласці',
    ogTitle: 'Арганік - свежыя арганічныя прадукты',
    ogDescription: 'Свежыя сельгас-прадукты Даступныя аграпрадукты ў Мінскай вобласці'
  }
}