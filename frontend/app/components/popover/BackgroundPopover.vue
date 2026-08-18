<script setup lang="ts">
import { backgroundTranslations } from '~/locales/background'

interface Props {
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

// Уникальный id поповера (аналогично ColorMode — на странице может быть несколько UBackground)
const popupId = useId()

const popupRef = useTemplateRef<HTMLElement>('popup')
const { close } = usePopover(popupId, popupRef)

const selectBackground = (bg: BackgroundItem) => {
  emit('select', bg)
  close()
}

const isActive = (bg: BackgroundItem) =>
  props.selectedId != null && String(bg.id) === String(props.selectedId)

const optionKey = (bg: BackgroundItem, index: number) => String(bg.id ?? index)
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
         Карточка внутри поповера: display на [popover] задавать нельзя. -->
    <div :id="popupId" ref="popup" popover="auto" class="background-popover__popover">
      <div class="background-popover__card">
        <h3 class="background-popover__title">{{ backgroundT.title }}</h3>

        <USlider
          :slides="backgrounds"
          variant="background"
          :slide-key="optionKey"
          show-pagination
          show-navigation
        >
          <template #default="{ slide }">
            <button
              type="button"
              class="background-popover__option"
              :class="{ 'background-popover__option_active': isActive(slide) }"
              :aria-label="`${backgroundT.ariaLabelOption}: ${slide.title}`"
              :aria-pressed="isActive(slide)"
              @click="selectBackground(slide)"
            >
              <UImage
                v-if="slide.thumbnail?.url || slide.imageWebp?.url"
                :src="slide.thumbnail?.url || slide.imageWebp.url"
                :alt="slide.title"
                width="220"
                height="124"
                class="background-popover__preview"
              />
              <span class="background-popover__label">{{ slide.title }}</span>
            </button>
          </template>
        </USlider>
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

  &__popover {
    position: fixed;
    margin: 0;
    margin-block-start: toRem(8);

    opacity: 0;
    translate: 0 -toRem(8);
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
        translate: 0 -toRem(8);
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

  &__option {
    display: grid;
    gap: toRem(6);
    justify-items: center;
    width: 100%;
    padding: toRem(6);
    border: toRem(2) solid transparent;
    border-radius: toRem(8);
    background: transparent;
    cursor: pointer;
    transition: border-color var(--transition-duration);

    &_active {
      border-color: var(--success-color);
    }
  }

  &__preview {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: toRem(4);
  }

  &__label {
    font-size: toRem(13);
    font-weight: 500;
  }
}
</style>
