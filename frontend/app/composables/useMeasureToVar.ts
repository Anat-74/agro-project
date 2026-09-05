import { onMounted, onUnmounted, watch } from "vue"
import type { Ref } from "vue"

export interface UseMeasureToVarOptions {
  // Что мерить и возвращать строкой (например, "167px"). null — не обновлять
  // (элемент ещё не готов/нет смысла).
  measure: () => string | null
  // Условие активации: пока false — переменную не пишем (но замер продолжаем
  // пересчитывать при изменениях, чтобы значение было готово).
  enabled?: () => boolean
  // Реактивный триггер: при изменении пересчитываем (например, open/close диалога).
  active?: Ref<boolean>
  // Элемент, за изменениями размера которого следим (ResizeObserver): при
  // ресайзе источника замер пересчитывается автоматически. Если null — только
  // единичный замер на mount + по триггерам.
  observe?: () => HTMLElement | null | undefined
  // Куда писать: documentElement (по умолчанию) или конкретный элемент.
  target?: () => HTMLElement | null | undefined
}

// Паттерн «JS-замер → CSS-переменная» (products: --header-h, главная: --catalog-h).
// SSR-safe: на сервере ничего не делаем. CPU-минимально: запись в переменную
// происходит по событию (mount / ResizeObserver источника / триггер), а не на
// каждый кадр; дальше значение живёт как обычная CSS-переменная (значение в
// свойствах — без style queries, см. docs/style/patterns.md §6).
export const useMeasureToVar = (
  varName: string,
  options: UseMeasureToVarOptions,
) => {
  const { measure, enabled, active, observe, target } = options

  const update = () => {
    if (!import.meta.client) return
    if (enabled && !enabled()) return
    const value = measure()
    if (value == null) return
    const el = target ? target() : document.documentElement
    if (el) el.style.setProperty(varName, value)
  }

  let ro: ResizeObserver | undefined

  onMounted(() => {
    if (!import.meta.client) return
    update()
    const source = observe?.()
    if (!source) return
    ro = new ResizeObserver(update)
    ro.observe(source)
  })

  if (active) {
    watch(active, (v, old) => {
      if (!import.meta.client || v === old) return
      // Открытие: layout (ширина/отступ) в HeroSection применяется в nextTick
      // (двухфазный GPU-сдвиг), а grids едут за высотой секции. Один замер
      // сразу после события может поймать ЕЩЁ ЗАКРЫТОЕ положение (высота
      // занижена). Пересчитываем по rAF (после layout) ещё раз-два, пока
      // значение не сойдётся (RO добьёт оставшиеся изменения).
      update()
      let frames = 0
      const tick = () => {
        frames += 1
        update()
        if (frames < 3) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }

  onUnmounted(() => {
    ro?.disconnect()
    ro = undefined
  })

  return { update }
}
