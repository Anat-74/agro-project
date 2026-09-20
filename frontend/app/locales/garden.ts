export const gardenTranslations: Record<LocaleCode, {
  title: string
  subtitle: string
  question: string
  areaLabel: string
  areaUnit: string
  plants: string
  seeds: string
  fertilizer: string
  packs: string
  productsTitle: string
  purposeSeeds: string
  purposeSeedlings: string
  purposeFertilizer: string
  purposeOther: string
  emptyCrops: string
  emptyProducts: string
  unitGram: string
  unitPiece: string
  modeSeeds: string
  modeSeedlings: string
  modeFertilizer: string
  calcModes: string
  growingDays: string
  unitDay: string
  sowingLabel: string
  transplantLabel: string
  npkLabel: string
  kindLabel: string
  kindMineral: string
  kindOrganic: string
  noData: string
  articlesTitle: string
  sectionArticles: string
  relatedCrop: string
  calculatorCta: string
  howToTitle: string
  howToSteps: { name: string; text: string }[]
  faqTitle: string
}> = {
  ru: {
    title: 'Собери свою грядку',
    subtitle: 'Всё для посадки и урожая',
    question: 'Что сажаем?',
    areaLabel: 'Площадь',
    areaUnit: 'м²',
    plants: 'Растений',
    seeds: 'Семян',
    fertilizer: 'Удобрения',
    packs: 'Фасовка',
    productsTitle: 'Товары для растения',
    purposeSeeds: 'Семена',
    purposeSeedlings: 'Рассада',
    purposeFertilizer: 'Удобрения',
    purposeOther: 'Прочее',
    emptyCrops: 'Список растений пока пуст',
    emptyProducts: 'Товары для этого растения скоро появятся',
    unitGram: 'г',
    unitPiece: 'шт',
    modeSeeds: 'Семена',
    modeSeedlings: 'Рассада',
    modeFertilizer: 'Удобрение',
    calcModes: 'Режим расчёта',
    growingDays: 'Срок рассады',
    unitDay: 'дн.',
    sowingLabel: 'Посев',
    transplantLabel: 'Высадка',
    npkLabel: 'NPK',
    kindLabel: 'Вид',
    kindMineral: 'минеральное',
    kindOrganic: 'органическое',
    noData: 'Для этой культуры данных пока нет',
    articlesTitle: 'Статьи по растению',
    sectionArticles: 'Статьи по посадке и урожаю',
    relatedCrop: 'Растение',
    calculatorCta: 'Рассчитать посадку',
    howToTitle: 'Как рассчитать посадку',
    howToSteps: [
      { name: 'Выберите растение', text: 'В разделе «Всё для посадки и урожая» выберите культуру: томат, огурец, перец, морковь или укроп.' },
      { name: 'Укажите площадь грядки', text: 'Введите площадь в м² (или длину грядки) — калькулятор посчитает число растений по схеме посадки.' },
      { name: 'Получите расчёт', text: 'Переключайте режимы «Семена», «Рассада» и «Удобрение»: норма высева с учётом всхожести, количество растений и граммы удобрения.' },
      { name: 'Добавьте товары в корзину', text: 'Нажмите «В корзину» у нужного товара — количество пачек рассчитается автоматически.' },
    ],
    faqTitle: 'Частые вопросы',
  },
  be: {
    title: 'Збяры сваю градку',
    subtitle: 'Усё для пасадкі і ўраджаю',
    question: 'Што саджаем?',
    areaLabel: 'Плошча',
    areaUnit: 'м²',
    plants: 'Раслін',
    seeds: 'Насення',
    fertilizer: 'Угнаення',
    packs: 'Фасоўка',
    productsTitle: 'Тавары для расліны',
    purposeSeeds: 'Насенне',
    purposeSeedlings: 'Расада',
    purposeFertilizer: 'Угнаенні',
    purposeOther: 'Іншае',
    emptyCrops: 'Спіс раслін пакуль пусты',
    emptyProducts: 'Тавары для гэтай расліны хутка з’явяцца',
    unitGram: 'г',
    unitPiece: 'шт',
    modeSeeds: 'Насенне',
    modeSeedlings: 'Расада',
    modeFertilizer: 'Угнаенне',
    calcModes: 'Рэжым разліку',
    growingDays: 'Тэрмін расады',
    unitDay: 'дзён',
    sowingLabel: 'Пасеў',
    transplantLabel: 'Высадка',
    npkLabel: 'NPK',
    kindLabel: 'Від',
    kindMineral: 'мінеральнае',
    kindOrganic: 'арганічнае',
    noData: 'Для гэтай расліны даных пакуль няма',
    articlesTitle: 'Артыкулы пра расліну',
    sectionArticles: 'Артыкулы пра пасадку і ўраджай',
    relatedCrop: 'Расліна',
    calculatorCta: 'Разлічыць пасадку',
    howToTitle: 'Як разлічыць пасадку',
    howToSteps: [
      { name: 'Выберыце расліну', text: 'У раздзеле «Усё для пасадкі і ўраджаю» выберыце культуру: тамат, агурок, перац, моркву ці кроп.' },
      { name: 'Пазначце плошчу градкі', text: 'Увядзіце плошчу ў м² (ці даўжыню градкі) — калькулятар палічыць колькасць раслін па схеме пасадкі.' },
      { name: 'Атрымайце разлік', text: 'Пераключайце рэжымы «Насенне», «Расада» і «Угнаенне»: норма пасеву з улікам усходжасці, колькасць раслін і грамы ўгнаення.' },
      { name: 'Дадайце тавары ў кошык', text: 'Націсніце «Дадаць у кошык» каля патрэбнага тавару — колькасць пачак разлічыцца аўтаматычна.' },
    ],
    faqTitle: 'Частыя пытанні',
  }
}
