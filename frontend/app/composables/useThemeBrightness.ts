export const useThemeBrightness = () => {
  // Стартовое значение — ~8% (5–10): кнопка ползунка по умолчанию в начале инпута
  const brightness = useState("theme-brightness", () => 8)

  const setBrightness = (value: number) => {
    brightness.value = Math.min(100, Math.max(0, value))
  }

  return { brightness, setBrightness }
}
