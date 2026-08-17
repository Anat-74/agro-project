<script setup lang="ts">
import { usePopover } from "~/composables/usePopover";

interface Props {
  // Уникальный id попапа (генерится в ColorMode через useId — на странице 2 ColorMode)
  popupId: string;
  themes: { key: string; label: string }[];
  active: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{ select: [theme: string] }>();

const popupRef = useTemplateRef<HTMLElement>("popup");

const { close } = usePopover(props.popupId, popupRef);

function select(theme: string) {
  emit("select", theme);
  close();   // выбор опции внутри поповера не триггерит нативное авто-закрытие
}
</script>

<template>
  <!-- popover="auto": открытие по popovertarget на кнопке-триггере, закрытие
       кликом вне/Escape — нативно, без JS. Позиция: центр экрана по горизонтали,
       прижат к верху (top-center), без якоря -->
  <div :id="popupId" ref="popup" popover="auto" class="color-mode-popup">
    <!-- Карточка внутри поповера: display на [popover] задавать нельзя
         (перебьёт UA-скрытие) -->
    <div class="color-mode-popup__card">
      <button
        v-for="theme in themes"
        :key="theme.key"
        type="button"
        :class="[
          'color-mode-popup__option',
          `color-mode-popup__option_${theme.key}`,
          { 'color-mode-popup__option_active': active === theme.key },
        ]"
        @click="select(theme.key)"
      >
        <Icon v-if="theme.key === 'light'" name="ph:sun-duotone" />
        <Icon v-else-if="theme.key === 'dark'" name="ph:moon-light" />
        <Icon v-else name="material-symbols:auto-awesome" />
        <span>{{ theme.label }}</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.color-mode-popup {
  position: fixed;
  top: 0;
  inset-inline: 0;          // left/right: 0 + margin-inline auto → центр по горизонтали
  inset-block-end: auto;    // снимаем UA bottom, чтобы прижать к верху
  margin: 0;
  margin-inline: auto;
  width: fit-content;

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

  &__card {
    display: flex;
    flex-direction: column;
    gap: toRem(4);
    padding: toRem(8);
    border-radius: toRem(8);
    background: var(--secondary-color);
    box-shadow: 0 toRem(4) toRem(12) rgba(0, 0, 0, 0.15);
  }

  &__option {
    display: flex;
    align-items: center;
    gap: toRem(8);
    padding: toRem(6) toRem(12);
    border: none;
    border-radius: toRem(4);
    cursor: pointer;
    background: transparent;
    color: var(--color);
    font-size: toEm(14);
    transition: background var(--transition-duration);

    // Заглублённая (recessed) линия между опциями
    &:not(:last-child) {
      border-block-end: 1px solid rgba(0, 0, 0, 0.25);
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    // Цветные иконки по теме
    &_light {
      color: var(--warning-color);   // солнце
    }

    &_custom {
      color: #ff5e7e;   // яркий «анимированный» цвет

      svg {
        animation: color-mode-popup-sway 3s ease-in-out infinite;
      }
    }

    &_dark {
      color: #5b6ee1;   // луна (индиго)
    }

    @include hover {
      background: var(--bg);
    }

    &_active {
      background: var(--success-color);
      color: var(--light-color);
    }
  }
}

@keyframes color-mode-popup-sway {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg);
  }
}
</style>
