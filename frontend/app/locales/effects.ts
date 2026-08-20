export const effectTranslations: Record<LocaleCode, {
  ariaLabel: string
  effectNames: Record<"press" | "zoom" | "focus", string>
}> = {
  ru: {
    ariaLabel: "Сменить эффект фона",
    effectNames: { press: "Вдавливание", zoom: "Приближение", focus: "Фокус" },
  },
  be: {
    ariaLabel: "Змяніць эфект фону",
    effectNames: { press: "Уціск", zoom: "Набліжэнне", focus: "Фокус" },
  },
}
