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

const dialogRef = useTemplateRef<HTMLDialogElement>('background-dialog')
const { open, close } = useDialog('background-switcher', dialogRef, { useShowMethod: false })

defineExpose({ open, close })

const selectBackground = (bg: BackgroundItem) => {
  emit('select', bg)
  close?.()
}

const isActive = (bg: BackgroundItem) => props.selectedId != null && String(bg.id) === String(props.selectedId)

const optionKey = (bg: BackgroundItem, index: number) => String(bg.id ?? index)
</script>

<template>
  <div class="background-switcher">
    <UButton
      class="background-switcher__trigger"
      icon="mingcute:palette-line"
      :aria-label="backgroundT.ariaLabelTrigger"
      variant="icon"
      @click="open"
    />

    <dialog ref="background-dialog" class="background-switcher__dialog">
      <div class="background-switcher__panel">
        <header class="background-switcher__header">
          <h3 class="background-switcher__title">{{ backgroundT.title }}</h3>
          <button
            type="button"
            class="background-switcher__close"
            :aria-label="backgroundT.ariaLabelClose"
            @click="close"
          >
            <Icon name="mingcute:close-line" />
          </button>
        </header>

        <div class="background-switcher__grid">
          <button
            v-for="(bg, index) in backgrounds"
            :key="optionKey(bg, index)"
            type="button"
            class="background-switcher__option"
            :class="{ 'background-switcher__option_active': isActive(bg) }"
            :aria-label="`${backgroundT.ariaLabelOption}: ${bg.title}`"
            :aria-pressed="isActive(bg)"
            @click="selectBackground(bg)"
          >
            <UImage
              v-if="bg.thumbnail?.url || bg.imageWebp?.url"
              :src="bg.thumbnail?.url || bg.imageWebp.url"
              :alt="bg.title"
              width="200"
              height="112"
              class="background-switcher__preview"
            />
            <span class="background-switcher__label">{{ bg.title }}</span>
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style lang="scss" scoped>
.background-switcher {
  &__trigger {
    position: fixed;
    bottom: toRem(24);
    inset-inline-end: toRem(24);
    z-index: 900;
  }

  &__dialog {
    width: min(92vw, toRem(520));
    border: none;
    border-radius: toRem(16);
    padding: 0;
    background: var(--bg);
    color: var(--color);

    scale: 0.96;
    opacity: 0;
    transition:
      scale var(--transition-duration),
      opacity var(--transition-duration),
      overlay var(--transition-duration) allow-discrete,
      display var(--transition-duration) allow-discrete;

    &[open] {
      scale: 1;
      opacity: 1;
    }

    @starting-style {
      &[open] {
        scale: 0.96;
        opacity: 0;
      }
    }

    &::backdrop {
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition:
        opacity var(--transition-duration),
        overlay var(--transition-duration) allow-discrete,
        display var(--transition-duration) allow-discrete;
    }

    &[open]::backdrop {
      opacity: 1;
    }

    @starting-style {
      &[open]::backdrop {
        opacity: 0;
      }
    }
  }

  &__panel {
    display: grid;
    gap: toRem(16);
    padding: toRem(20);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: toRem(12);
  }

  &__title {
    margin: 0;
    font-weight: 700;
    @include adaptiveValue("font-size", 20, 18);
  }

  &__close {
    display: grid;
    place-items: center;
    width: toRem(36);
    height: toRem(36);
    border-radius: 50%;
    cursor: pointer;
    color: var(--color);
    transition: background var(--transition-duration);

    svg {
      font-size: toRem(20);
    }

    @include hover {
      background: var(--bg-secondary);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(toRem(150), 1fr));
    gap: toRem(12);

    > * {
      min-width: 0;
    }
  }

  &__option {
    display: grid;
    gap: toRem(8);
    justify-items: center;
    padding: toRem(8);
    border: toRem(2) solid transparent;
    border-radius: toRem(8);
    background: var(--bg-product);
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
    font-size: toRem(14);
    font-weight: 500;
  }
}
</style>
