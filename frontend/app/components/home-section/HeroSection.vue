<script setup lang="ts">
import type { HeroSlide } from "@/types/types";

interface Props {
  slides: HeroSlide[];
  slideKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  slideKey: "id",
});
</script>

<template>
  <section>
    <AppSlider
      v-if="props.slides && props.slides.length > 0"
      class="hero-slider"
      :slides="props.slides"
      item-key="id"
    >
      <template #default="{ slide, index }">
        <UBackground
          src="Bg-hero 1x" 
          :retinaSrc="slide.retinaBgImage?.url"
          :shouldPreload="index === 0"
        />
        <UImage
          v-if="slide.image?.url"
          class="hero-slider__image"
          :src="slide.image.url"
          :alt="slide.heading"
          :smooth-load="true"
          :loading="index === 0 ? 'eager' : 'lazy'"
          :fetchpriority="index === 0"
          width="742"
          height="498"
        />
        <div class="hero-slider__text-content">
          <h2 v-if="slide.heading" class="hero-slider__title">
            {{ slide.heading }}
          </h2>
          <span v-if="slide.textTop" class="hero-slider__text-top">
            {{ slide.textTop }}
          </span>
          <strong
            v-if="slide.saleText && slide.isDiscount"
            class="hero-slider__sale"
          >
            {{ slide.saleText }}
          </strong>
          <p v-if="slide.textBottom" class="hero-slider__text-bottom">
            {{ slide.textBottom }}
          </p>
        </div>
      </template>
    </AppSlider>
  </section>
</template>

<style lang="scss" scoped>
.hero-slider {
  &__image {
  }
}
</style>
