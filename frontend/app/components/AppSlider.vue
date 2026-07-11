<script setup lang="ts" generic="T = any">
interface Props<T = any> {
  slides: T[];
  slideKey?: keyof T | string;
  height?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  slideKey: "id" as keyof T | string,
  showPagination: true,
  showNavigation: true,
  height: "var(--min-height)"
});

const container = useTemplateRef("container");
const active = ref(1);

let rafId: number;

const go = (n: number) => {
  const width = container.value?.clientWidth || 0;
  container.value?.scrollTo({
    left: (n - 1) * width,
    behavior: "smooth",
  });
  active.value = n;
};

const handleScroll = () => {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const width = container.value?.clientWidth || 1;
    const newActive =
      Math.round((container.value?.scrollLeft || 0) / width) + 1;

    if (newActive !== active.value) {
      active.value = newActive;
    }
  });
};

const next = () => active.value < props.slides.length && go(active.value + 1);
const prev = () => active.value > 1 && go(active.value - 1);

onUnmounted(() => cancelAnimationFrame(rafId));
</script>

<template>
  <div 
  class="slider" 
  :style="{ minHeight: props.height }"
  >
    <div 
    ref="container" 
    class="slider__container" 
    @scroll="handleScroll"
    >
      <div
        class="slider__slide"
        v-for="(slide, index) in props.slides"
        :key="slide[props.slideKey] || index"
      >
        <slot :slide="slide" :index="index">
          <div class="slider__slide-content">
            {{ slide }}
         </div>
        </slot>
      </div>
    </div>

    <UButton
      v-if="props.showNavigation"
      @click="prev"
      :disabled="active <= 1"
      icon="mdi:chevron-left"
      variant="slide-prev"
      aria-label="Предыдущий слайд"
    />

    <UButton
      v-if="props.showNavigation"
      @click="next"
      :disabled="active === props.slides.length"
      icon="mdi:chevron-left"
      variant="slide-next"
      aria-label="Следующий слайд"
    />

    <div class="slider__pagination" v-if="props.showPagination">
      <button
        v-for="(slide, index) in props.slides"
        :key="slide[props.slideKey] || index"
        :class="[
          'slider__pagination-dot',
          { 'slider__pagination-dot_active': active === index + 1 },
        ]"
        @click="go(index + 1)"
        :aria-label="`Перейти к слайду ${index + 1}`"
        :aria-current="active === index + 1 ? 'true' : undefined"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.slider {
  position: relative;
  z-index: 100;
  width: 100%;
  background-color: var(--bg-product);
  @include colorMix();

  &__container {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    display: flex;
    column-gap: toRem(14);
    padding-block-start: toRem(4);
    padding-block-end: toEm(98);

    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

   @media (min-width:$tablet){
      padding-block-start: toEm(18);
    }

  &__slide {
    flex: 0 0 100%;
    scroll-snap-align: center;
    display: grid;
    grid-template-columns: auto 1fr;
    place-items: center;
    column-gap: toEm(32);
    color: var(--color);

    @media (max-width:$tablet){
      grid-template-columns: 1fr;
    }
  }

  &__pagination {
    display: flex;
    justify-content: center;
    column-gap: toRem(12);
    position: absolute;
    left: 50%;
    translate: -50% 0;
    bottom: toRem(44);

    @media (min-width:$tablet){
        bottom: toRem(108);
    }

    @media (max-width:$mobileSmall){
       column-gap: toRem(38); 
    }
  }

  &__pagination-dot {
    width: toRem(14);
    height: toRem(14);
    border: toRem(2) solid var(--transparent-color);
    border-radius: 50%;
    background-color: var(--light-color);
    transition: background-color var(--transition-duration);

    @media (max-width:$mobileSmall){
      width: toEm(16);
      height: toEm(16);
      border-color: var(--warning-color);
      outline: toRem(2) solid var(--warning-color);
      outline-offset: toRem(3);
    }

    &_active {
      cursor: default;
      outline-color: var(--warning-color);
      border-color: var(--light-color);
      background-color: var(--warning-color);
    }

    @include hover {
      &:not(.slider__pagination-dot_active) {
        background-color: var(--warning-color);
      }
    }
  }
}
</style>
