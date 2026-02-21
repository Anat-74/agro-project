<script setup lang="ts">
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
const { currentLocale } = useLocale();
import { VISIBILITY_KEY } from "#shared/utils/visibility";
const { isContacts } = inject<VisibilityState>(VISIBILITY_KEY)!;
const { isOpen } = useDialog("hamburgerDialog");

interface Props {
  grids: HeroGrid[];
}

const { grids } = defineProps<Props>();
</script>

<template>
  <h2 class="visually-hidden">
    {{ visuallyHiddenTranslations[currentLocale].heroGridsTitle }}
  </h2>
  <ul
    :class="[
      'hero-grids hero-grids__container',
      { 'hero-grids_is-visible': isContacts || isOpen },
    ]"
  >
    <li
      v-for="grid in grids"
      :key="grid.id"
      v-show="grid.isVisible"
      class="hero-grids__item"
    >
      <UImage
        v-if="grid.icons?.url"
        :src="grid.icons.url"
        :alt="grid.heading"
        :smoothLoad="false"
        type="icon"
        width="44"
        height="44"
      />
      <h3 class="hero-grids__title">{{ grid.heading }}</h3>
      <span class="hero-grids__text">{{ grid.text }}</span>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.hero-grids {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  align-items: center;
  column-gap: toEm(16);
  padding-block: toEm(6);
  background-color: var(--light-color);

  @media (min-width: $tablet) {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: center;
    column-gap: toEm(30);
    position: absolute;
    z-index: 100;
    left: 50%;
    translate: -50% -50%;
    top: 100%;
    width: 95%;
    border-radius: toRem(6);
    background-color: var(--light-color);
    box-shadow: 0 8px 40px 0 rgba(0, 38, 3, 0.26);
    transition: background-color 0.4s;

    &_is-visible {
      transition: background-color var(--transition-duration);
      filter: blur(9px);
    }
  }

  &__item {
    display: inline-grid;
    justify-items: center;
    row-gap: toEm(8);
    text-align: center;
    padding-block: toRem(22);
  }

  &__title {
    @media (max-width: $mobileSmall) {
      max-width: toRem(160);
    }
  }

  &__text {
    font-size: toRem(14);

    @media (max-width: $tablet) {
      display: none;
    }
  }
}
</style>
