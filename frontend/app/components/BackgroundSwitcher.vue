<script setup lang="ts">
import type { BackgroundItem } from '~/types/background'

interface Props {
  backgrounds: BackgroundItem[]
  selectedId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [bg: BackgroundItem]
}>()

const dialogRef = useTemplateRef<HTMLDialogElement>('dialog')

const openDialog = () => dialogRef.value?.showModal()
const closeDialog = () => dialogRef.value?.close()

const selectBackground = (bg: BackgroundItem) => {
  emit('select', bg)
  closeDialog()
}
</script>

<template>
  <div class="background-switcher">
    <button
      class="background-switcher__trigger"
      @click="openDialog"
      aria-label="Выбрать фон"
    >
      🎨
    </button>

    <dialog ref="dialog" class="background-switcher__dialog">
      <div class="background-switcher__inner">
        <header class="background-switcher__header">
          <h3>Выберите фон</h3>
          <button
            class="background-switcher__close"
            @click="closeDialog"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </header>

        <div class="background-switcher__grid">
          <button
            v-for="bg in backgrounds"
            :key="bg.id"
            :class="[
              'background-switcher__option',
              { 'background-switcher__option_active': selectedId === bg.id },
            ]"
            @click="selectBackground(bg)"
          >
            <img
              :src="bg.thumbnail || bg.imageWebp"
              :alt="bg.title"
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
    bottom: toRem(80);
    right: toRem(24);
    z-index: 999;
    width: toRem(48);
    height: toRem(48);
    border-radius: 50%;
    border: none;
    background: var(--success-color);
    color: var(--light-color);
    font-size: toRem(22);
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: transform var(--transition-duration);

    @include hover {
      transform: scale(1.1);
    }
  }

  &__dialog {
    border: none;
    border-radius: toRem(16);
    padding: 0;
    background: var(--secondary-color);
    max-width: toRem(520);
    width: 90vw;

    &::backdrop {
      background: rgba(0, 0, 0, 0.4);
    }
  }

  &__inner {
    padding: toRem(20);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: toRem(16);

    h3 {
      margin: 0;
      font-size: toEm(20);
      color: var(--color);
    }
  }

  &__close {
    background: none;
    border: none;
    font-size: toEm(20);
    cursor: pointer;
    color: var(--color);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(toRem(140), 1fr));
    gap: toRem(12);
  }

  &__option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: toRem(8);
    padding: toRem(8);
    border: toRem(2) solid transparent;
    border-radius: toRem(8);
    cursor: pointer;
    background: var(--bg);
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
    font-size: toEm(14);
    color: var(--color);
  }
}
</style>
