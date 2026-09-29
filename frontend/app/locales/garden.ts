export const gardenTranslations: Record<LocaleCode, {
  title: string
  subtitle: string
  question: string
  areaLabel: string
  areaUnit: string
  areaUnits: string
  areaUnitSqm: string
  areaUnitSotka: string
  areaUnitSotkaTab: string
  calcHeading: string
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
  articlesLoadError: string
  articlesRetry: string
  relatedCrop: string
  calculatorCta: string
  howToTitle: string
  howToSteps: { name: string; text: string }[]
  faqTitle: string
  seoPlantsTitle: string
  seoProductsTitle: string
  seoModesTitle: string
  // Подписи строк результата и режимов «Заготовок»
  sugar: string
  salt: string
  vinegar: string
  water: string
  yield: string
  modeJam: string
  modeCanning: string
  modeSalting: string
  purposeIngredients: string
  purposeJars: string
  weightLabel: string
  unitKg: string
  unitG: string
  unitMl: string
  unitL: string
}> = {
  ru: {
    title: 'Собери свою грядку',
    subtitle: 'Всё для посадки и урожая',
    question: 'Что сажаем?',
    areaLabel: 'Площадь',
    areaUnit: 'м²',
    areaUnits: 'Единицы площади',
    areaUnitSqm: 'М²',
    areaUnitSotka: 'соток',
    areaUnitSotkaTab: 'Сотки',
    calcHeading: 'Калькулятор расчёта',
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
    articlesLoadError: 'Не удалось загрузить статью',
    articlesRetry: 'Повторить',
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
    seoPlantsTitle: 'Растения раздела',
    seoProductsTitle: 'Товары раздела',
    seoModesTitle: 'Режимы расчёта',
    sugar: 'Сахар',
    salt: 'Соль',
    vinegar: 'Уксус',
    water: 'Вода',
    yield: 'Выход',
    modeJam: 'Варенье',
    modeCanning: 'Консервация',
    modeSalting: 'Засолка',
    purposeIngredients: 'Ингредиенты',
    purposeJars: 'Тара и крышки',
    weightLabel: 'Вес продукта',
    unitKg: 'кг',
    unitG: 'г',
    unitMl: 'мл',
    unitL: 'л',
  },
  be: {
    title: 'Збяры сваю градку',
    subtitle: 'Усё для пасадкі і ўраджаю',
    question: 'Што саджаем?',
    areaLabel: 'Плошча',
    areaUnit: 'м²',
    areaUnits: 'Адзінкі плошчы',
    areaUnitSqm: 'М²',
    areaUnitSotka: 'сотак',
    areaUnitSotkaTab: 'Соткі',
    calcHeading: 'Калькулятар разліку',
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
    articlesLoadError: 'Не ўдалося загрузіць артыкул',
    articlesRetry: 'Паўтарыць',
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
    seoPlantsTitle: 'Расліны раздзела',
    seoProductsTitle: 'Тавары раздзела',
    seoModesTitle: 'Рэжымы разліку',
    sugar: 'Цукар',
    salt: 'Соль',
    vinegar: 'Воцат',
    water: 'Вада',
    yield: 'Выхад',
    modeJam: 'Варэнне',
    modeCanning: 'Кансерваванне',
    modeSalting: 'Засолка',
    purposeIngredients: 'Інгрэдыенты',
    purposeJars: 'Тара і вечкі',
    weightLabel: 'Вага прадукту',
    unitKg: 'кг',
    unitG: 'г',
    unitMl: 'мл',
    unitL: 'л',
  }
}

/** Тип переводов секции-калькулятора (для composable и компонентов) */
export type GardenTranslations = (typeof gardenTranslations)[LocaleCode];

/**
 * Переопределения текстов для раздела «Заготовки»: базой идут посадковые тексты
 * (общие подписи интерфейса совпадают), здесь меняется смысловое.
 */
export const preservesOverrides: Record<LocaleCode, Partial<GardenTranslations>> = {
  ru: {
    title: 'Заготовки и консервация',
    subtitle: 'Всё для варенья, консервации и засолки',
    question: 'Что заготавливаем?',
    calcHeading: 'Калькулятор заготовки',
    productsTitle: 'Товары для заготовки',
    articlesTitle: 'Статьи по заготовкам',
    emptyCrops: 'Список продуктов пока пуст',
    emptyProducts: 'Товары для этой заготовки скоро появятся',
    noData: 'Для этого продукта данных пока нет',
    relatedCrop: 'Продукт',
    calculatorCta: 'Рассчитать заготовку',
    howToTitle: 'Как рассчитать заготовку',
    areaLabel: 'Вес продукта',
    areaUnits: 'Единицы веса',
    areaUnitSqm: 'кг',
    areaUnitSotkaTab: 'Граммы',
    areaUnitSotka: 'грамм',
    seoPlantsTitle: 'Продукты раздела',
    seoProductsTitle: 'Товары раздела',
    howToSteps: [
      { name: 'Выберите продукт', text: 'В разделе «Заготовки» выберите ягоды, фрукты или овощи, которые хотите заготовить.' },
      { name: 'Укажите вес', text: 'Введите вес продукта в килограммах — калькулятор посчитает сахар, соль, уксус и воду.' },
      { name: 'Выберите режим', text: 'Переключайте режимы «Варенье», «Консервация» и «Засолка»: для каждого свои нормы и выход готового продукта.' },
      { name: 'Добавьте товары в корзину', text: 'Нажмите «В корзину» у нужного товара — количество пачек рассчитается автоматически.' },
    ],
  },
  be: {
    title: 'Загатоўкі і кансерваванне',
    subtitle: 'Усё для варэння, кансервавання і засолкі',
    question: 'Што загатоўваем?',
    calcHeading: 'Калькулятар загатоўкі',
    productsTitle: 'Тавары для загатоўкі',
    articlesTitle: 'Артыкулы пра загатоўкі',
    emptyCrops: 'Спіс прадуктаў пакуль пусты',
    emptyProducts: 'Тавары для гэтай загатоўкі хутка з’явяцца',
    noData: 'Для гэтага прадукту даных пакуль няма',
    relatedCrop: 'Прадукт',
    calculatorCta: 'Разлічыць загатоўку',
    howToTitle: 'Як разлічыць загатоўку',
    areaLabel: 'Вага прадукту',
    areaUnits: 'Адзінкі вагі',
    areaUnitSqm: 'кг',
    areaUnitSotkaTab: 'Грамы',
    areaUnitSotka: 'грам',
    seoPlantsTitle: 'Прадукты раздзела',
    seoProductsTitle: 'Тавары раздзела',
    howToSteps: [
      { name: 'Выберыце прадукт', text: 'У раздзеле «Загатоўкі» выберыце ягады, садавіну ці гародніну, якія хочаце загатаваць.' },
      { name: 'Пазначце вагу', text: 'Увядзіце вагу прадукту ў кілаграмах — калькулятар палічыць цукар, соль, воцат і ваду.' },
      { name: 'Выберыце рэжым', text: 'Пераключайце рэжымы «Варэнне», «Кансерваванне» і «Засолка»: для кожнага свае нормы і выхад гатовага прадукту.' },
      { name: 'Дадайце тавары ў кошык', text: 'Націсніце «У кошык» каля патрэбнага тавару — колькасць пачак разлічыцца аўтаматычна.' },
    ],
  },
};

/** Готовые тексты раздела «Заготовки» (посадковая база + переопределения) */
export const preservesTranslations: Record<LocaleCode, GardenTranslations> = {
  ru: { ...gardenTranslations.ru, ...preservesOverrides.ru },
  be: { ...gardenTranslations.be, ...preservesOverrides.be },
};
