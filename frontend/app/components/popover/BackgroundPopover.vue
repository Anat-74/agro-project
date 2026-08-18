<script setup lang="ts">
import { backgroundTranslations } from '~/locales/background'

interface Props {
  // Уникальный id попапа — генерируется в UBackground (useId), т.к. у async-компонента
  // useId на сервере/клиенте расходится (popovertarget не совпал бы с id)
  popupId: string;
  backgrounds: BackgroundItem[]
  selectedId?: number | string | null
}

const props = withDefaults(defineProps<Props>(), {
  backgrounds: () => [],
  selectedId: null,
})

const emit = defineEmits<{
  select: [bg: BackgroundItem]
}>()

const { currentLocale } = useLocale()
const backgroundT = computed(() => backgroundTranslations[currentLocale.value])

const popupRef = useTemplateRef<HTMLElement>('popup')
// usePopover синхронизирует isOpen; закрытие — только нативное (клик вне/Escape)
usePopover(props.popupId, popupRef)

const selectBackground = (bg: BackgroundItem) => {
  emit('select', bg)
  // Окно НЕ закрывается при выборе — можно перебирать фоны.
  // Закрытие: клик вне окна / Escape (нативный light-dismiss popover="auto").
}

const isActive = (bg: BackgroundItem) =>
  props.selectedId != null && String(bg.id) === String(props.selectedId)

const optionKey = (bg: BackgroundItem, index: number) => String(bg.id ?? index)

// Пагинация-миниатюры вынесены отдельным блоком вне слайдера (как в ShowModalProduct):
// активная миниатюра подсвечивается бордером, клик листает слайдер
interface SliderApi {
  go: (n: number) => void
  active: Ref<number>
}

const sliderRef = useTemplateRef<SliderApi>('slider')

// defineExpose уже разворачивает ref в Vue 3.5 — обрабатываем оба случая: число или ref
const sliderActive = computed<number>(() => {
  const active = sliderRef.value?.active
  return typeof active === "number" ? active : (active?.value ?? 1)
})
</script>

<template>
  <div class="background-popover">
    <UButton
      class="background-popover__trigger"
      icon="mingcute:palette-line"
      :aria-label="backgroundT.ariaLabelTrigger"
      variant="icon"
      :popovertarget="popupId"
    />

    <!-- Popover API: открытие/закрытие кликом, Escape и кликом вне — нативно.
         Окно по центру внизу экрана. Карточка внутри поповера: display на [popover] задавать нельзя. -->
    <div :id="popupId" ref="popup" popover="auto" class="background-popover__popover">
      <div class="background-popover__card">
        <h3 class="background-popover__title">{{ backgroundT.title }}</h3>

        <USlider
          ref="slider"
          :slides="backgrounds"
          variant="background"
          :slide-key="optionKey"
          :show-pagination="false"
          :show-navigation="backgrounds.length > 1"
        >
          <template #default="{ slide }">
            <UImage
              v-if="slide.thumbnail?.url || slide.imageWebp?.url"
              :src="slide.thumbnail?.url || slide.imageWebp.url"
              :alt="slide.title"
              width="220"
              height="124"
              class="background-popover__preview"
            />
          </template>
        </USlider>

        <!-- Пагинация — отдельный блок вне слайдера: миниатюры, активная с бордером -->
        <div v-if="backgrounds.length > 1" class="background-popover__thumbs">
          <button
            v-for="(bg, i) in backgrounds"
            :key="optionKey(bg, i)"
            type="button"
            class="background-popover__thumb"
            :class="{ 'background-popover__thumb_active': sliderActive === i + 1 }"
            :aria-label="`${backgroundT.ariaLabelOption}: ${bg.title}`"
            :aria-pressed="sliderActive === i + 1"
            @click="selectBackground(bg); sliderRef?.go(i + 1)"
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
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.background-popover {
  &__trigger {
    position: fixed;
    bottom: toRem(24);
    inset-inline-end: toRem(24);
    z-index: 900;
  }

  // Окно по центру в самом низу экрана (top-layer)
  &__popover {
    position: fixed;
    inset-inline: 0;
    inset-block-start: auto;
    inset-block-end: 0;
    margin: 0 auto toRem(24);
    width: fit-content;

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

  &__card {
    display: grid;
    gap: toRem(8);
    padding: toRem(12);
    border-radius: toRem(8);
    background: var(--secondary-color);
    box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.15);
    width: min(90vw, toRem(280));
  }

  &__title {
    margin: 0;
    font-weight: 700;
    @include adaptiveValue("font-size", 16, 14);
  }

  &__preview {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: toRem(4);
  }

  // Пагинация — отдельный блок вне слайдера: миниатюры с рамкой, активная подсвечена
  // (паттерн ShowModalProduct: бордер переносится на активную миниатюру)
  &__thumbs {
    display: flex;
    justify-content: center;
    gap: toRem(8);
    margin-block-start: toRem(12);
  }

  &__thumb {
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

  &__thumb-img {
    width: toRem(40);
    height: toRem(40);
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: toRem(4);
    background-color: var(--bg-product);
    display: block;
  }
}
</style>
