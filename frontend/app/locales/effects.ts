export const effectTranslations: Record<LocaleCode, {
  hint: string
  ariaLabel: string
  effectNames: Record<"press" | "zoom" | "focus", string>
}> = {
  ru: {
    hint: "Тап по фону — сменить эффект",
    ariaLabel: "Сменить эффект фона",
    effectNames: { press: "Вдавливание", zoom: "Приближение", focus: "Фокус" },
  },
  be: {
    hint: "Націсніце на фон — змяніць эфект",
    ariaLabel: "Змяніць эфект фону",
    effectNames: { press: "Уціск", zoom: "Набліжэнне", focus: "Фокус" },
  },
}
