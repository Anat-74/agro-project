<script setup lang="ts">
interface Slide {
  id: number;
  content: any;
}

interface Props {
  slides: Slide[];
  height?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: "400px",
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

const next = () => active.value < props.slides.length && go(active.value + 1);
const prev = () => active.value > 1 && go(active.value - 1);

onUnmounted(() => cancelAnimationFrame(rafId));
</script>

<template>
  <div class="slider">
    <div 
    ref="container" 
    class="slider__container" 
    @scroll="handleScroll"
    >
      <div
      class="slider__slide"
      v-for="slide in props.slides" 
       :key="slide.documentId || slide.id" 
      >
        <slot 
        :slide="slide" 
         :index="slide.documentId || slide.id"
        >
            <div 
            class="slider__slide-content"
            >{{ slide.content }}
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
        v-for="slide in props.slides"
         :key="slide.documentId || slide.id"
        :class="[
      'slider__pagination-dot', { 'slider__pagination-dot_active': active === (slide.documentId || slide.id) }
      ]"
         @click="go(slide.documentId || slide.id)"
        :aria-label="`Перейти к слайду ${slide.id}`"
        :aria-current="active === slide.id ? 'true' : undefined"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.slider {
  position: relative;
  width: 100%;
  height: v-bind("props.height");
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
    background-color: var(--border-color);
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
    width: toRem(12);
    height: toRem(12);
    border: toRem(2) solid var(--transparent-color);
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    transition: background-color var(--transition-duration);
    background-color: var(--light-color);

    &_active {
      cursor: default;
      scale: 1.2;
      border-color: var(--light-color);
      background-color: var(--primary-color);
    }

      @include hover {
         &:not(.slider__pagination-dot_active) {
         background-color: var(--warning-color);
      }
   }
  }
}
</style>
