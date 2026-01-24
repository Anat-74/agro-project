<script setup lang="ts">
import type { HeroGrid } from "@/types/types";
import { visuallyHiddenTranslations } from "~/locales/visuallyHidden";
const { currentLocale } = useLocale();

interface Props {
  grids: HeroGrid[];
}

const { grids } = defineProps<Props>();
</script>

<template>
    <h2 class="visually-hidden">{{ visuallyHiddenTranslations[currentLocale].heroGridsTitle }}</h2>
   <ul class="hero-grids hero-grids__container">
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
      type="icon"
   />
   <h3 class="hero-grids__title">{{ grid.heading }}</h3>
   <span class="hero-grids__text">{{ grid.text }}</span>
   </li>
   </ul>
</template>

<style lang="scss" scoped>
.hero-grids {
   display: flex;
   justify-content: space-between;
   align-items: center;

		&__item {
         display: inline-grid;
         justify-items: center;
         row-gap: toEm(8);
         text-align: center;
		}

		&__title {
		}

		&__text {
		}
}

</style>