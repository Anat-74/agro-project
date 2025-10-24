import type { LocaleCode } from "../types/types"

export const visuallyHiddenTranslations: Record<LocaleCode, {
   sectionProductSlugTitle: string
   sectionSubcategorySlugList: string
   sectionLangTitle: string
   sectionAboutUsTitle: string
   sectionOurServicesTitle: string
   sectionContactsTitle: string
   showModalMenuTitle: string

}> = {
   ru: {
      sectionProductSlugTitle: "Секция с описанием товара",
      sectionSubcategorySlugList: "Список товаров подкатегории",
      sectionLangTitle: "Секция с категориями товаров или главная страница",
      sectionAboutUsTitle: "Секция - О нас",
      sectionOurServicesTitle: "Секция - наши услуги",
      showModalMenuTitle: "Список товаров категории и подкатегории",
      sectionContactsTitle: "Секция с контактами компании"
   },
   en: {
      sectionProductSlugTitle: "Product description section",
      sectionSubcategorySlugList: "List of products in subcategory",
      sectionLangTitle: "Product categories section or main page",
      sectionAboutUsTitle: "Section - About Us",
      sectionOurServicesTitle: "Section - our services",
      showModalMenuTitle: "List of products by category and subcategory",
      sectionContactsTitle: "Company contacts section"
   },
   be: {
      sectionProductSlugTitle: "Секцыя з апісаннем тавару",
      sectionSubcategorySlugList: "Спіс тавараў падкатэгорыі",
      sectionLangTitle: "Секцыя з катэгорыямі тавараў або галоўная старонка",
      sectionAboutUsTitle: "Секцыя - Пра нас",
      sectionOurServicesTitle: "Секцыя - нашы паслугі",
      showModalMenuTitle: "Спіс тавараў катэгорыі, а так-жа падкатэгорыі",
      sectionContactsTitle: "Секцыя з кантактамі кампаніі"
   }
 }