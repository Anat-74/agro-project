<script setup lang="ts">
import { VISIBILITY_KEY } from "#shared/utils/visibility";
const { currentLocale } = useLocale();
const { isContacts } = inject<VisibilityState>(VISIBILITY_KEY)!;

interface Props {
  slides: HeroSlide[];
  heroGrids?: HeroGrid[];
}

const props = withDefaults(defineProps<Props>(), {
  heroGrids: () => [],
});
const { slides, heroGrids } = props;
</script>

<template>
  <section 
  :class="['hero-slider', { 'hero-slider_is-visible': isContacts }, { 'hero-slider_is-margin': heroGrids?.[3]?.isVisible===false}]" 
  aria-labelledby="hero"
  >
    <USlider
      v-if="slides && slides.length > 0"
      :class="[
        'hero-slider__slider',
        { 'hero-slider__slider_is-visible': isContacts },
      ]"
      :slides="slides"
      variant="hero"
    >
      <template #default="{ slide, index }">
        <UBackground
          v-if="
            slide.backgroundImage?.retinaBgImageAvif?.url ||
            slide.backgroundImage?.baseBgImageWebp?.url
          "
          :src="slide.backgroundImage?.baseBgImageWebp?.url"
          :retina-src="slide.backgroundImage?.retinaBgImageAvif?.url"
          size-mode="contain"
          bg-position="top center"
        />
        <UImage
          v-if="slide.image?.url"
          type="hero"
          :src="slide.image.url"
          :alt="slide.heading"
          :loading="index === 0 ? 'eager' : 'lazy'"
          :fetchpriority="index === 0"
          width="742"
          height="498"
        />
        <div class="hero-slider__text-content">
          <span v-if="slide.textTop" class="hero-slider__text-top">
            {{ slide.textTop }}
          </span>
          <h1 v-if="slide.heading" id="hero" class="hero-slider__title">
            {{ slide.heading }}
          </h1>
          <strong
            v-if="slide.saleText && slide.isDiscount"
            class="hero-slider__sale"
          >
            {{ slide.saleText }} <span>{{ slide.percentDiscount }}</span>
          </strong>
          <p
            v-if="slide.textBottom && slide.isTextBottom"
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
    </USlider>

    <HeroGrids
    v-if="heroGrids && heroGrids.length > 0" 
    :grids="heroGrids" 
    />
  </section>
</template>

<style lang="scss" scoped>
.hero-slider {
  @media (min-width: $tablet) {
    position: relative;
    transition: filter .4s;
    margin-block-end: toEm(170);

    &_is-margin {
      margin-block-end: toEm(42);
    }

      &_is-visible {
         transition: filter var(--transition-duration);
         filter: grayscale(90%);
   }
  }

  &__slider {
   transition: background-color .4s;
   &_is-visible {
      transition: background-color var(--transition-duration);
      filter: blur(9px);
   }
  }

  &__text-content {
    position: relative;
    max-width: toRem(596);
    display: grid;
    row-gap: toEm(12);
    padding-block: toEm(25);

    > * { min-width: 0; }

    @media (max-width: $tablet) {
      justify-items: center;
      padding-block: toRem(2);
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
      content: "*";
      color: var(--success-color);
    }
  }

  &__title {
    margin-block-end: toEm(4);
    @include adaptiveValue("font-size", 62, 28);

    @media (max-width: $tablet) {
      text-align: center;
    }
  }

  &__sale {
    display: inline-flex;
    column-gap: toEm(2);
    font-size: toEm(24);
    font-family: $font-family-content;
    font-weight: 400;
    color: var(--success-color);

    span {
      color: var(--danger-color);
    }
  }

  &__text-bottom {
    font-size: toRem(14);

    @media (max-width: $tablet) {
      text-align: center;
    }
  }

  &__link {
    justify-self: start;
    height: toEm(48);
    display: inline-flex;
    align-items: center;
    column-gap: toEm(8);
    padding-inline: toEm(25);
    border-radius: toEm(25);
    color: var(--light-color);
    background-color: var(--success-color);
    @include adaptiveValue("margin-block-start", 48, 16);

    @media (max-width: $tablet) {
      justify-self: end;
    }

    svg {
      font-size: toEm(20);
    }
  }

  // Анимации для custom-темы
  @container style(--theme: custom) {
    animation: fadeInScale 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;

    &__title {
      animation: typewriter 1.2s steps(30) 0.8s forwards;
      overflow: hidden;
      white-space: nowrap;
      width: 0;
    }
  }

}
</style>
