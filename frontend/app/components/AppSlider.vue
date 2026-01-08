<script setup lang="ts">
const container = useTemplateRef("container");
const slides = [1, 2, 3, 4]
const active = ref(1)

let rafId: number

const go = (n: number) => {
  const width = container.value?.clientWidth || 0
  container.value?.scrollTo({ 
    left: (n - 1) * width, 
    behavior: 'smooth' 
  })
  active.value = n
}

const handleScroll = () => {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    const width = container.value?.clientWidth || 1
    const newActive = Math.round((container.value?.scrollLeft || 0) / width) + 1
    
    if (newActive !== active.value) {
      active.value = newActive
    }
  })
}

const next = () => active.value < slides.length && go(active.value + 1)
const prev = () => active.value > 1 && go(active.value - 1)

onUnmounted(() => cancelAnimationFrame(rafId))
</script>

<template>
   <section class="slider">
    <div 
      ref="container"
      class="slider__container"
      @scroll="handleScroll"
    >
        <div 
          v-for="slide in slides"
          :key="slide"
          class="slider__slide"
        >
          Слайд {{ slide }}
        </div>
    </div>
    
    <UButton
    @click="prev"
    :disabled="active === 1"
    icon="mdi:chevron-left"
    variant="slide-prev"
    aria-label="Предыдущий слайд"
    />

   <UButton
    @click="next"
    :disabled="active === slides.length"
    icon="mdi:chevron-left"
    variant="slide-next"
    aria-label="Следующий слайд"
    />
    
    <div class="slider__pagination">
      <button
        v-for="slide in slides"
        :key="slide"
        class="slider__pagination-dot"
        :class="{ 'active': active === slide }"
        @click="go(slide)"
        :aria-label="`Перейти к слайду ${slide}`"
        :aria-current="active === slide ? 'true' : undefined"
      />
    </div>
    </section>
</template>

<style lang="scss" scoped>

  .slider {
    width: 100%;
    height: 300px;
    padding: 12px;

    &__container {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    display: flex;
    height: 100%;

    &::-webkit-scrollbar { display: none; }
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
    
    &:hover { background: #999; }
    
    &.active {
      background: var(--primary-color);
      transform: scale(1.2);
      border-color: white;
      }
   }
  }
</style>