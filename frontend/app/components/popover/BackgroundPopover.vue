<script setup lang="ts">
import { backgroundTranslations } from '~/locales/background'
import { effectTranslations } from '~/locales/effects'

interface Props {
  // Уникальный id попапа — генерируется в UBackground (useId), т.к. у async-компонента
  // useId на сервере/клиенте расходится (popovertarget не совпал бы с id)
  popupId: string;
  backgrounds?: BackgroundItem[]
  selectedId?: number | string | null
  sizeMode?: "cover" | "contain" | "original"
  effectName?: string
}

const props = withDefaults(defineProps<Props>(), {
  backgrounds: () => [],
  selectedId: null,
  sizeMode: "cover",
  effectName: "",
})

const emit = defineEmits<{
  select: [bg: BackgroundItem]
  sizeChange: [mode: "cover" | "contain" | "original"]
  cycleEffect: []
}>()

const { currentLocale } = useLocale()
const backgroundT = computed(() => backgroundTranslations[currentLocale.value])
const effectT = computed(() => effectTranslations[currentLocale.value])

// Открытый диалог фильтров (страница товаров) — на mobile скрываем кнопку-триггер,
// чтобы не мешала полноэкранному оверлею фильтров
const { isOpen: filterDialogOpen } = useDialog("shopFilterDialog")

const sizeOptions = computed(() => [
  { value: "cover", label: backgroundT.value.sizeCover, icon: "🖼️" },
  { value: "contain", label: backgroundT.value.sizeContain, icon: "🔲" },
  { value: "original", label: backgroundT.value.sizeOriginal, icon: "📏" },
])

const onSizeChange = (value: string | number) => {
  emit('sizeChange', String(value) as "cover" | "contain" | "original")
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
      :class="[
        'background-popover__trigger',
        {
          'background-popover__trigger_hidden': isOpen,
          'background-popover__trigger_hidden-filter': filterDialogOpen,
        },
      ]"
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

        <!-- Размер отображения фона: переиспользуемый USelect -->
        <USelect
          class="background-popover__size-wrapper"
          :model-value="sizeMode"
          :label="backgroundT.sizeLabel"
          :options="sizeOptions"
          @update:model-value="onSizeChange"
        />

        <!-- Эффект фона: мини-кнопка-иконка в правом нижнем углу (выпуклость box-shadow) -->
        <UButton
          class="background-popover__effect"
          variant="plain"
          :aria-label="`${effectT.ariaLabel}: ${effectName}`"
          @click="emit('cycleEffect')"
        >
          <Icon name="mingcute:sparkles-line" />
        </UButton>
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

// Только позиционирование — внешний вид в UButton (variant="palette").
// Плавно скрывается, когда окно открыто (isOpen из usePopover)
.background-popover__trigger {
  position: fixed;
  bottom: toRem(29);
  inset-inline-end: toRem(29);
  z-index: 900;
  pointer-events: auto;
  transition:
    opacity var(--transition-duration),
    visibility var(--transition-duration);

  &_hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  // Открытый диалог фильтров (mobile) — триггер не нужен
  &_hidden-filter {
    @media (max-width: $mobile) {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  }
}

// Окно по центру в самом низу экрана (top-layer).
// pointer-events: auto — иначе попап наследует none от обёртки, и клики
// проходят сквозь него → нативный light-dismiss закрывает окно сразу.
// Фон и блюр — на самом [popover] (top-layer), а не на карточке: так блюр
// рендерится сразу при открытии, без задержки вложенного backdrop-filter
.background-popover__popover {
  position: fixed;
  inset-inline: 0;
  inset-block-start: auto;
  inset-block-end: 0;
  margin: 0 auto toRem(24);
  width: fit-content;
  pointer-events: auto;

  // Фон окна: полупрозрачный + блюр (уменьшен, чтобы были видны
  // очертания элементов под окном)
  background-color: var(--transparent-color);
  backdrop-filter: blur(toRem(12));
  border: toRem(1) solid var(--border-color);
  border-radius: toRem(8);
  box-shadow: 0 toRem(4) toRem(16) rgba(0, 0, 0, 0.2);

  opacity: 0;
  translate: 0 toRem(8);
  transition:
    opacity var(--transition-duration),
    translate var(--transition-duration),
    overlay var(--transition-duration) allow-discrete,
    display var(--transition-duration) allow-discrete;

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
  // Фон/блюр/бордер окна — на самом [popover] (см. выше)
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

  :deep(.select) {
    width: toRem(150);
  }
}

// Кнопка эффекта фона: мини-иконка в правом нижнем углу карточки, выпуклый вид
// (box-shadow по паттерну кнопки темы). Вложен в .background-popover__card —
// выше специфичность UButton.
.background-popover__card {
  .background-popover__effect {
    position: absolute;
    inset-block-end: toRem(8);
    inset-inline-end: toRem(8);
    width: toRem(24);
    height: toRem(24);
    padding: 0;
    background-color: var(--light-color);
    border-radius: toRem(6);
    // Тонкий бордер с медленным еле заметным переливом — намёк, что это кнопка
    border: toRem(2) solid var(--border-color);
    animation: effect-btn-border 4s ease-in-out infinite;
    // Выпуклость: внешняя тень снизу + светлая кромка сверху + втисненная тень
    box-shadow:
      0 toRem(2) toRem(4) rgba(0, 0, 0, 0.25),
      inset 0 toRem(2) toRem(3) rgba(0, 0, 0, 0.25),
      0 toRem(1) 0 rgba(255, 255, 255, 0.4);

    :deep(svg) {
      color: var(--warning-hover);
      width: toRem(18);
      height: toRem(18);
    }
  }
}

// Перелив бордера: едва заметный, медленный (снижен при prefers-reduced-motion
// глобальным правилом в _normalize.scss)
@keyframes effect-btn-border {
  0%,
  100% {
    border-color: var(--border-color);
  }
  50% {
    border-color: color-mix(in srgb, var(--warning-hover) 35%, var(--border-color));
  }
}
</style>
