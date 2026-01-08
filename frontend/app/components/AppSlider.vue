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
  height: "300px",
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
      v-for="slide in props.slides" 
      :key="slide.id" 
      class="slider__slide"
      >
        <slot 
        :slide="slide" 
        :index="slide.id"
        >
          {{ slide.content }}
        </slot>
      </div>
    </div>

    <UButton
      v-if="props.showNavigation"
      @click="prev"
      :disabled="active === 1"
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

    <div v-if="props.showPagination" class="slider__pagination">
      <button
        v-for="slide in props.slides"
        :key="slide.id"
        class="slider__pagination-dot"
        :class="{ active: active === slide.id }"
        @click="go(slide.id)"
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
  padding: 12px;

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
    scroll-snap-align: start;
    display: grid;
    place-items: center;
    font-size: 2rem;
    background-color: var(--border-color);
    color: var(--color);
  }

  &__pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    position: absolute;
    left: 50%;
    translate: -50% 0;
    bottom: 0;
  }

  &__pagination-dot {
    width: 0.75rem;
    height: 0.75rem;
    background: #ccc;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;
    padding: 0;

    &:hover {
      background: #999;
    }

    &.active {
      background: var(--primary-color);
      transform: scale(1.2);
      border-color: white;
    }
  }
}
</style>
