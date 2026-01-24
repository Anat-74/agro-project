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
          type="hero"
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
            <Icon name="mingcute:arrow-right-line" />
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
         display: grid;
         row-gap: toEm(12);

         @media (max-width:$tablet){
            justify-items: center;
            // padding-inline: toEm(44);
         }
		}

      &__text-top {
         display: inline-flex;
         column-gap: toRem(2);
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
         margin-block-end: toEm(4);

         @media (max-width:$tablet){
            text-align: center;
         }
		}

		&__sale {
         display: inline-flex;
         column-gap: toEm(2);
         font-size: toEm(26);
         font-family: $font-family-content;
         font-weight: 400;
         color: var(--success-color);

         &::after {
            content: '%';
            color: var(--danger-color);
         }
		}

		&__text-bottom {
         font-size: toRem(14);
         @include adaptiveValue("margin-block-end", 48, 16);

         @media (max-width:$tablet){
            text-align: center;
         }
		}

      &__link {
         justify-self: start;
         position: relative;
         z-index: 999;
         height: toEm(48);
         display: inline-flex;
         align-items: center;
         column-gap: toEm(8);
         padding-inline: toEm(25);
         border-radius: toEm(25);
         color: var(--light-color);
         background-color: var(--success-color);

         @media (max-width:$tablet){
            justify-self: end;
         }

         svg {
            font-size: toEm(20);
         }
      }
}

</style>