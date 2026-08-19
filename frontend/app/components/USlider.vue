<script setup lang="ts" generic="T = any">
interface Props<T = any> {
  slides: T[];
  slideKey?: keyof T | string;
  height?: string;
  variant?: "hero" | "product" | "background";
  paginationPosition?: "bottom" | "left";
  showPagination?: boolean;
  showNavigation?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  slideKey: "id" as keyof T | string,
  height: "var(--min-height)",
  variant: "hero",
  paginationPosition: "bottom",
  showPagination: true,
  showNavigation: true,
});

const container = useTemplateRef("container");
const active = ref(1);

let rafId: number;
// Пока идёт программный плавный скролл (клик по пагинации), не пересчитываем
// активный слайд: scroll-события во время анимации возвращали бы active обратно
// (2 → 1 → 2) и миниатюра «мигала» бордером.
let suppressScrollActive = false;
let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;

const go = (n: number) => {
  const width = container.value?.clientWidth || 0;
  container.value?.scrollTo({
    left: (n - 1) * width,
    behavior: "smooth",
  });
  active.value = n;
  suppressScrollActive = true;
  clearTimeout(scrollEndTimer);
  scrollEndTimer = setTimeout(() => {
    suppressScrollActive = false;
  }, 500);
};

const handleScroll = () => {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    if (suppressScrollActive) return;
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

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  clearTimeout(scrollEndTimer);
});

// Для внешнего управления слайдером (напр. пагинация-миниатюры вне слайдера в модалке)
defineExpose({ go, active, prev, next });
</script>

<template>
  <div
    :class="[
      'slider',
      `slider_${props.variant}`,
      { 'slider_pagination-left': props.paginationPosition === 'left' },
    ]"
    :style="{ minHeight: props.height }"
  >
    <div
      ref="container"
      class="slider__container"
      @scroll="handleScroll"
    >
      <div
        v-for="(slide, index) in props.slides"
        :key="slide[props.slideKey] || index"
        class="slider__slide"
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
      :disabled="active <= 1"
      icon="mdi:chevron-left"
      variant="slide-prev"
      :class="{ 'hidden-mobilesmall': props.variant === 'hero' }"
      aria-label="Предыдущий слайд"
      @click="prev"
    />

    <UButton
      v-if="props.showNavigation"
      :disabled="active === props.slides.length"
      icon="mdi:chevron-left"
      variant="slide-next"
      :class="{ 'hidden-mobilesmall': props.variant === 'hero' }"
      aria-label="Следующий слайд"
      @click="next"
    />

    <div v-if="props.showPagination" class="slider__pagination">
      <!-- Кастомная пагинация (например, миниатюры товара) через слот.
           По умолчанию — точки (hero). -->
      <slot name="pagination" :go="go" :active="active" :slides="props.slides">
        <button
          v-for="(slide, index) in props.slides"
          :key="slide[props.slideKey] || index"
          :class="[
            'slider__pagination-dot',
            { 'slider__pagination-dot_active': active === index + 1 },
          ]"
          :aria-label="`Перейти к слайду ${index + 1}`"
          :aria-current="active === index + 1 ? 'true' : undefined"
          @click="go(index + 1)"
        />
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Общая механика слайдера (scroll-snap). Контекстная стилизация — в вариантах:
// slider_hero (главная) и slider_product (страница товара).
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
    color: var(--color);
  }

  &__pagination {
    display: flex;
    justify-content: center;
    column-gap: toRem(12);
  }

  &__pagination-dot {
    width: toRem(14);
    height: toRem(14);
    border: toRem(2) solid var(--transparent-color);
    border-radius: 50%;
    background-color: var(--light-color);
    transition: background-color var(--transition-duration);

    @media (max-width: $mobileSmall) {
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

  // ===== Вариант: hero (главная) =====
  &_hero {
    .slider__container {
      column-gap: toRem(14);
      padding-block-start: toRem(4);
      padding-block-end: toEm(98);

      @media (min-width: $tablet) {
        padding-block-start: toEm(18);
      }
    }

    .slider__slide {
      grid-template-columns: auto 1fr;
      column-gap: toEm(32);

      @media (max-width: $tablet) {
        grid-template-columns: 1fr;
      }
    }

    .slider__pagination {
      position: absolute;
      left: 50%;
      translate: -50% 0;
      bottom: toRem(44);

      @media (min-width: $tablet) {
        bottom: toRem(108);
      }

      @media (max-width: $mobileSmall) {
        column-gap: toRem(38);
      }
    }
  }

  // ===== Вариант: product (страница товара) =====
  &_product {
    .slider__container {
      column-gap: 0;
      padding-block-start: toRem(4);
      padding-block-end: toRem(4);
      // Глобальное правило [class*="__container"] (_settings.scss) добавляет
      // padding-inline (12px) и margin-inline: auto — из-за этого слайды уже
      // контейнера и в модалке виден край следующего слайда. Для product-слайдера
      // отступы не нужны: изображение заполняет всю ширину.
      padding-inline: 0;
      margin-inline: 0;
      max-width: none;
    }

    .slider__slide {
      grid-template-columns: 1fr;
    }

    .slider__pagination {
      position: static;
      translate: none;
      left: auto;
      bottom: auto;
      margin-block-start: toRem(12);
      flex-wrap: wrap;
    }
  }

  // ===== Пагинация слева, вертикально (напр. модалка товара) =====
  &_pagination-left {
    display: flex;
    align-items: flex-start;
    gap: toRem(16);

    .slider__container {
      flex: 1;
      min-width: 0;
    }

    .slider__pagination {
      order: -1;
      flex-direction: column;
      flex-wrap: nowrap;
      gap: toRem(8);
      margin: 0;
      align-self: flex-start;
    }
  }

  // ===== Вариант: background (выбор фона, поповер) =====
  // Компактный горизонтальный слайдер: по одному превью на экран,
  // навигация prev/next по бокам, свайп — нативный (scroll-snap)
  &_background {
    background-color: transparent;
    min-height: 0 !important;

    .slider__container {
      column-gap: toRem(8);
      padding: 0;
      scroll-snap-type: x mandatory;
    }

    .slider__slide {
      flex: 0 0 100%;
      padding: 0;
    }

    .slider__pagination {
      margin-block-start: toRem(8);
    }
  }
}
</style>
