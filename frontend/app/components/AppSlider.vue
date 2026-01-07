<!-- <script setup lang="ts">
const slides = ref([
  { id: 1, content: 'Слайд 1' },
  { id: 2, content: 'Слайд 2' },
  { id: 3, content: 'Слайд 3' },
  { id: 4, content: 'Слайд 4' },
  // Добавьте больше слайдов по необходимости
])
</script>

<template>
  <section class="slider">
    <div class="slider__container">
      <div class="slider__track">
        <div 
          v-for="slide in slides" 
          :key="slide.id"
          :id="`slide-${slide.id}`"
          class="slider__slide"
        >
          {{ slide.content }}
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.slider {
  width: 100%;
  padding: toEm(30);

  &__container {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    width: 100%;
    height: 300px;
    position: relative;

    @include adaptiveValue("height", 300, 200);

    /* Включаем автоматическую группу маркеров после слайдера */
    scroll-marker-group: after;
  }

  &__container::-webkit-scrollbar {
    display: none;
  }

  &__container {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Нативные стрелки навигации */
  &__container::scroll-button(left) {
    content: "←";
    display: block;
    padding: toRem(10);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    cursor: pointer;
    position: absolute;
    top: 50%;
    left: toRem(10);
    transform: translateY(-50%);
    z-index: 1;
    border-radius: toRem(4);
  }

  &__container::scroll-button(right) {
    content: "→";
    display: block;
    padding: toRem(10);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    cursor: pointer;
    position: absolute;
    top: 50%;
    right: toRem(10);
    transform: translateY(-50%);
    z-index: 1;
    border-radius: toRem(4);
  }

  &__track {
    display: flex;
    width: 100%;
    height: 100%;
  }

  &__slide {
    flex: 0 0 100%;
    scroll-snap-align: start;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    background: var(--bg-product);
    height: 100%;
    color: var(--color);

    /* Стили для маркеров пагинации (точек) */
    &::scroll-marker {
      content: "";
      display: inline-block;
      width: toRem(12);
      height: toRem(12);
      background: var(--gray-color);
      border-radius: 50%;
      cursor: pointer;
      transition: background var(--transition-duration),
        transform var(--transition-duration);
    }

    /* Стиль активной точки */
    &::scroll-marker:target-current {
      background: var(--primary-color);
      transform: scale(1.2);
    }
  }

  /* Стилизация контейнера пагинации */
  &__container::scroll-marker-group {
    display: flex;
    justify-content: center;
    padding: toRem(15) 0;
    position: absolute;
    bottom: toRem(10);
    left: 0;
    right: 0;
    gap: toRem(8);
  }
}
</style> -->

//=====================

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const slides = [1, 2, 3, 4]
const container = ref<HTMLElement>()
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
    <!-- Контейнер слайдера -->
    <div 
      ref="container"
      class="slider__container"
      @scroll="handleScroll"
    >
      <div class="slider__track">
        <div 
          v-for="slide in slides"
          :key="slide"
          class="slider__slide"
        >
          Слайд {{ slide }}
        </div>
      </div>
    </div>
    
    <!-- Кнопки навигации -->
    <button 
      class="slider__btn slider__btn--prev" 
      @click="prev"
      :disabled="active === 1"
      aria-label="Предыдущий слайд"
    >
      ←
    </button>
    
    <button 
      class="slider__btn slider__btn--next" 
      @click="next"
      :disabled="active === slides.length"
      aria-label="Следующий слайд"
    >
      →
    </button>
    
    <!-- Пагинация -->
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
  padding: 2rem;
  position: relative;

  &__container {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    width: 100%;
    height: 300px;
    
    &::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  &__track {
    display: flex;
    height: 100%;
  }

  &__slide {
    flex: 0 0 100%;
    scroll-snap-align: start;
    display: grid;
    place-items: center;
    font-size: 2rem;
    background: var(--bg-product);
    color: var(--color);
  }

  &__btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 2.5rem;
    height: 2.5rem;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    z-index: 10;
    transition: all 0.3s;
    
    &:hover:not(:disabled) { 
      background: rgba(0, 0, 0, 0.7); 
    }
    
    &:disabled {
      opacity: 0.3;
      cursor: default;
      background: rgba(0, 0, 0, 0.2);
    }
    
    &--prev { left: 0.5rem; }
    &--next { right: 0.5rem; }
    
    @media (max-width: 768px) { display: none; }
  }

  &__pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
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