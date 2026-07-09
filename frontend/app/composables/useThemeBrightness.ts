export const useThemeBrightness = () => {
  const brightness = ref(50)

  const setBrightness = (value: number) => {
    brightness.value = Math.min(100, Math.max(0, value))
  }

  return { brightness, setBrightness }
}
