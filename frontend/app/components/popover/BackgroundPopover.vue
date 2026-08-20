<script setup lang="ts">
import { backgroundTranslations } from '~/locales/background'

interface Props {
  // Уникальный id попапа — генерируется в UBackground (useId), т.к. у async-компонента
  // useId на сервере/клиенте расходится (popovertarget не совпал бы с id)
  popupId: string;
  backgrounds?: BackgroundItem[]
  selectedId?: number | string | null
  sizeMode?: "cover" | "contain" | "original"
}

const props = withDefaults(defineProps<Props>(), {
  backgrounds: () => [],
  selectedId: null,
  sizeMode: "cover",
})

const emit = defineEmits<{
  select: [bg: BackgroundItem]
  sizeChange: [mode: "cover" | "contain" | "original"]
}>()

const { currentLocale } = useLocale()
const backgroundT = computed(() => backgroundTranslations[currentLocale.value])

const sizeOptions = computed(() => [
  { value: "cover", label: backgroundT.value.sizeCover, icon: "🖼️" },
  { value: "contain", label: backgroundT.value.sizeContain, icon: "🔲" },
  { value: "original", label: backgroundT.value.sizeOriginal, icon: "📏" },
] as const)

const onSizeChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as "cover" | "contain" | "original"
  emit('sizeChange', value)
}

const popupRef = useTemplateRef<HTMLElement>('popup')
// usePopover синхронизирует isOpen; закрытие — только нативное (клик вне/Escape)
const { isOpen } = usePopover(props.popupId, popupRef)

const selectBackground = (bg: BackgroundItem) => {
  emit('select', bg)
  // Окно НЕ закрывается при выборе — можно перебирать фоны.
  // Закрытие: клик вне окна / Escape (нативный light-dismiss popover="auto").
}

// Уникальный ключ для v-for по фонам (id фона или индекс как fallback)
const optionKey = (bg: BackgroundItem, index: number) => String(bg.id ?? index)

// Пагинация-миниатюры вынесены отдельным блоком вне слайдера (как в ShowModalProduct):
// активная миниатюра подсвечивается бордером, клик листает слайдер
interface SliderApi {
  go: (n: number, smooth?: boolean) => void
  active: Ref<number>
  prev: () => void
  next: () => void
}

const sliderRef = useTemplateRef<SliderApi>('slider')

// defineExpose уже разворачивает ref в Vue 3.5 — обрабатываем оба случая: число или ref
const sliderActive = computed<number>(() => {
  const active = sliderRef.value?.active
  return typeof active === "number" ? active : (active?.value ?? 1)
})

// Выбор фона при смене слайда (свайп, клик по миниатюрам):
// следим за активным слайдом и применяем соответствующий фон
watch(sliderActive, (n) => {
  const bg = props.backgrounds[n - 1]
  if (bg) selectBackground(bg)
})

// Индекс выбранного на странице фона (selectedId из UBackground) — 1-based
const selectedIndex = computed<number | null>(() => {
  if (props.selectedId == null) return null
  const i = props.backgrounds.findIndex((bg) => String(bg.id) === String(props.selectedId))
  return i >= 0 ? i + 1 : null
})

// Навигация на страницу с другим фоном: активный слайд/миниатюра должны показывать
// фон этой страницы. Прокрутку при закрытом поповере сделать нельзя (clientWidth = 0),
// поэтому ставим активный индекс сразу, а позицию скролла выставим при открытии.
watch(selectedIndex, (n) => {
  if (n == null || sliderActive.value === n) return
  sliderRef.value?.go(n, false)
}, { immediate: true })

// При открытии поповера — прокрутить слайдер к выбранному фону страницы
watch(isOpen, (open) => {
  if (!open) return
  const n = selectedIndex.value
  if (n != null) nextTick(() => sliderRef.value?.go(n, false))
})
</script>

<template>
  <div class="background-popover">
    <UButton
      class="background-popover__trigger"
      icon="mingcute:palette-line"
      :aria-label="backgroundT.ariaLabelTrigger"
      variant="palette"
      :popovertarget="popupId"
    />

    <!-- Popover API: открытие/закрытие кликом, Escape и кликом вне — нативно.
         Окно по центру внизу экрана. Карточка внутри поповера: display на [popover] задавать нельзя. -->
    <div :id="popupId" ref="popup" popover="auto" class="background-popover__popover">
      <div class="background-popover__card">
        <h3 class="background-popover__title">{{ backgroundT.title }}</h3>

        <div class="background-popover__slider-wrap">
          <USlider
            ref="slider"
            :slides="backgrounds"
            variant="background"
            :slide-key="'id'"
            :show-pagination="false"
            :show-navigation="false"
          >
            <template #default="{ slide }">
              <UImage
                v-if="slide.thumbnail?.url || slide.imageWebp?.url"
                :src="slide.thumbnail?.url || slide.imageWebp.url"
                :alt="slide.title"
                width="220"
                height="112"
                class="background-popover__preview"
              />
            </template>
          </USlider>
        </div>

        <!-- Пагинация — отдельный блок вне слайдера: миниатюры, активная с бордером.
             Клик листает слайдер, фон применяет watch(sliderActive) -->
        <div v-if="backgrounds.length > 1" class="background-popover__thumbs">
          <button
            v-for="(bg, i) in backgrounds"
            :key="optionKey(bg, i)"
            type="button"
            class="background-popover__thumb"
            :class="{ 'background-popover__thumb_active': sliderActive === i + 1 }"
            :aria-label="`${backgroundT.ariaLabelOption}: ${bg.title}`"
            :aria-pressed="sliderActive === i + 1"
            @click="sliderRef?.go(i + 1)"
          >
            <UImage
              v-if="bg.thumbnail?.url || bg.imageWebp?.url"
              :src="bg.thumbnail?.url || bg.imageWebp.url"
              :alt="bg.title"
              width="40"
              height="40"
              class="background-popover__thumb-img"
            />
          </button>
        </div>

        <!-- Размер отображения фона: единый класс .select (fallback + base-select) -->
        <div class="background-popover__size-wrapper select-wrapper">
          <label class="visually-hidden" for="background-size-select">
            {{ backgroundT.sizeLabel }}
          </label>
          <select
            id="background-size-select"
            class="background-popover__size select"
            :value="sizeMode"
            @change="onSizeChange"
          >
            <option
              v-for="opt in sizeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.icon }} {{ opt.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Обёртка на весь экран в top-слое, но НЕ перехватывает клики (pointer-events: none).
// !important — перебить глобальное правило .app-bg ~ * (z-index:1; position:relative),
// иначе обёртка получает z-index 1 и контент страницы перекрывает её.
.background-popover {
  position: fixed !important;
  inset: 0 !important;
  z-index: 900 !important;
  pointer-events: none;
}

// Только позиционирование — внешний вид в UButton (variant="palette")
.background-popover__trigger {
  position: fixed;
  bottom: toRem(24);
  inset-inline-end: toRem(24);
  z-index: 900;
  pointer-events: auto;
}

// Окно по центру в самом низу экрана (top-layer).
// pointer-events: auto — иначе попап наследует none от обёртки, и клики
// проходят сквозь него → нативный light-dismiss закрывает окно сразу
.background-popover__popover {
  position: fixed;
  inset-inline: 0;
  inset-block-start: auto;
  inset-block-end: 0;
  margin: 0 auto toRem(24);
  width: fit-content;
  pointer-events: auto;

  opacity: 0;
  translate: 0 toRem(8);
  transition:
    opacity 0.2s,
    translate 0.2s,
    overlay 0.2s allow-discrete,
    display 0.2s allow-discrete;

  &:popover-open {
    opacity: 1;
    translate: 0 0;
  }

  @starting-style {
    &:popover-open {
      opacity: 0;
      translate: 0 toRem(8);
    }
  }
}

.background-popover__card {
  display: grid;
  gap: toRem(6);
  padding: toRem(10);
  border-radius: toRem(8);
  // Прозрачный фон с блюром (паттерн ShowHamburger, размытие вдвое меньше — 11px)
  background-color: var(--transparent-color);
  backdrop-filter: blur(toRem(42));
  border: toRem(1) solid var(--border-color);
  box-shadow: 0 toRem(4) toRem(16) rgba(0, 0, 0, 0.2);
  width: min(90vw, toRem(260));   // уже — окно ниже
  position: relative;
}

.background-popover__title {
  margin: 0;
  font-family: "Neucha", cursive, sans-serif;
  color: var(--warning-hover);
  font-weight: 700;
  @include adaptiveValue("font-size", 17, 15);
}

.background-popover__preview {
  width: 100%;
  // Ниже (2/1 → 16/9: высота ~на 12% меньше)
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: toRem(4);
  // Свой бордер, как у пагинации — чтобы не сливалось
  border: toRem(2) solid var(--border-color);
  box-sizing: border-box;
}

// Пагинация — отдельный блок вне слайдера: миниатюры с рамкой, активная подсвечена
// (паттерн ShowModalProduct: бордер переносится на активную миниатюру)
.background-popover__thumbs {
  display: flex;
  justify-content: center;
  gap: toRem(8);
  margin-block-start: toRem(12);
}

.background-popover__thumb {
  border: toRem(2) solid transparent;
  border-radius: toRem(6);
  padding: toRem(2);
  background: none;
  cursor: pointer;
  opacity: 0.65;
  transition:
    opacity var(--transition-duration),
    border-color var(--transition-duration);

  &_active {
    opacity: 1;
    border-color: var(--success-color);
  }

  @include hover {
    opacity: 1;
  }
}

.background-popover__thumb-img {
  width: toRem(40);
  height: toRem(40);
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: toRem(4);
  background-color: var(--bg-product);
  display: block;
}

// Размер фона: единый класс .select (fallback + base-select из _utils.scss),
// здесь только компактная ширина для попапа
.background-popover__size-wrapper {
  justify-self: center;
}

.background-popover__size {
  width: toRem(150);
  // font-size не задаём: базовый .select (toRem(17)) — единый размер для всех select
}
</style>
