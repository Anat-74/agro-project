<script setup lang="ts">
import type { HeroSlide } from '@/types/types';

interface Props {
  slides: HeroSlide[];
  slideKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  slideKey: "id",
});
</script>

<template>
  <AppSlider
    class="category-slider"
    v-if="props.slides && props.slides.length > 0"
    :slides="props.slides"
    item-key="id"
  >
    <template #default="{ slide }">
      <div class="hero-slide">
        <div class="hero-slide__content">
          <div class="hero-slide__text-content">
            <h2 v-if="slide.heading" class="hero-slide__title">
              {{ slide.heading }}
            </h2>
            <span v-if="slide.textTop" class="hero-slide__subtitle">
              {{ slide.textTop }}
            </span>
            <strong
              v-if="slide.saleText && slide.isDiscount"
              class="hero-slide__sale"
            >
              {{ slide.saleText }}
            </strong>
            <span v-if="slide.textBottom" class="hero-slide__description">
              {{ slide.textBottom }}
            </span>
          </div>
          <UImage
            v-if="slide.image?.url"
            class="hero-slide__image"
            :src="slide.image.url"
            :alt="slide.heading"
            :smooth-load="true"
            width="742"
            height="498"
          />
        </div>
      </div>
    </template>
  </AppSlider>
</template>

<style lang="scss" scoped></style>
