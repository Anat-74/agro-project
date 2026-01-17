<script setup lang="ts" generic="T = any">
interface  Props<T = any> {
  slides: T[];
  slideKey?: keyof T | string;
  height?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  slideKey: 'id' as keyof T | string,
  height: "640px",
  showPagination: true,
  showNavigation: true,
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
// Почему не используется computed???
const next = () => active.value < props.slides.length && go(active.value + 1);
const prev = () => active.value > 1 && go(active.value - 1);

onUnmounted(() => cancelAnimationFrame(rafId));
</script>

<template>
  <div 
  class="slider"
  :style="{ height: props.height }"
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
        <slot 
        :slide="slide" 
        :index="index"
        >
         <div 
         class="slider__slide-content"
         >{{ slide }}
         </div>
        </slot>

      </div>
    </div>

    <UButton
      v-if="props.showNavigation"
      @click="prev"
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

    <div 
    class="slider__pagination" 
    v-if="props.showPagination"
    >
      <button
        v-for="(slide, index) in props.slides"
        :key="slide[props.slideKey] || index"
        :class="[
      'slider__pagination-dot', { 'slider__pagination-dot_active': active === index + 1 }
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
  width: 100%;
  background-color: var(--bg-product);
//   height: 100%;

  &__container {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    display: flex;
    height: 100%;

    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  &__slide {
    flex: 0 0 100%;
    scroll-snap-align: center;
    display: grid;
    place-items: center;
    font-size: toRem(32);
    color: var(--color);

    &:first-child {
      scroll-snap-align: start;
      .slider__slide-content {
         translate: toRem(16);
   }
}

    &:last-child {
      scroll-snap-align: end;
      .slider__slide-content {
         translate: toRem(-16);
      }
    }
  }

  &__pagination {
    display: flex;
    justify-content: center;
    column-gap: toRem(9);
    position: absolute;
    left: 50%;
    translate: -50% 0;
    bottom: toRem(12);
  }

  &__pagination-dot {
    width: toEm(14);
    height: toEm(14);
    border: toRem(2) solid var(--transparent-color);
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    background-color: var(--light-color);
    transition: background-color var(--transition-duration);

    &_active {
      cursor: default;
      scale: 1.3;
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
