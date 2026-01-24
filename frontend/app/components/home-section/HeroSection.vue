<script setup lang="ts">
import type { HeroSlide } from "@/types/types";
const { currentLocale } = useLocale();

interface Props {
  slides: HeroSlide[];
}

const { slides } = defineProps<Props>();
</script>

<template>
  <section aria-labelledby="hero-title">
    <AppSlider
      v-if="slides && slides.length > 0"
      class="hero-slider"
      :slides="slides"
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
            <span v-if="slide.textTop" class="hero-slider__text-top">
            {{ slide.textTop }}
          </span>
          <h1 
          v-if="slide.heading" 
          class="hero-slider__title"
          id="hero-title"
          >
            {{ slide.heading }}
          </h1>
          <strong
            v-if="slide.saleText && slide.isDiscount"
            class="hero-slider__sale"
          >
            {{ slide.saleText }}
          </strong>
          <p 
          v-if="slide.textBottom && slide.isShipping" 
          class="hero-slider__text-bottom"
          >
            {{ slide.textBottom }}
          </p>
          <NuxtLink 
          class="hero-slider__link"
          :to="`/${currentLocale}/contacts`"
          >
          {{ slide.textLink }}
          </NuxtLink>
        </div>
      </template>
    </AppSlider>
  </section>
</template>

<style lang="scss" scoped>

.hero-slider {
		&__text-content {
         max-width: toRem(596);

         @media (max-width:$tablet){
            text-align: center;
         }
		}

      &__text-top {
         display: inline-flex;
         column-gap: toRem(2);
         margin-block-end: toEm(4);
         text-transform: uppercase;
         font-size: toEm(14);
         color: var(--green-color);

         &::before,
         &::after {
            content: '*';
            color: var(--success-color);
         }
		}

		&__title {
         margin-block-end: toEm(8);
		}

		&__sale {
         display: inline-flex;
         column-gap: toRem(2);
         margin-block-end: toEm(8);
         font-size: toEm(26);
         font-family: $font-family-content;
         font-weight: 400;
         color: var(--success-color);

         &::after {
            content: '%';
            color: var(--warning-color);
         }
		}

		&__text-bottom {
         font-size: toRem(14);
         margin-block-end: toEm(8);
		}

      &__link {
         position: relative;
         z-index: 999;
      }
}

</style>