<script setup lang="ts">
import { VISIBILITY_KEY } from "#shared/utils/visibility";
const { currentLocale } = useLocale();
const { isContacts } = inject<VisibilityState>(VISIBILITY_KEY)!;
// Сдвиг слайдера при открытой desktop-панели каталога (ShowHamburger)
const { isCatalogOpen } = useCatalogPanel();

// ===== Двухфазный GPU-сдвиг слайдера (вариант B, docs/style/patterns.md) =====
// Layout-класс (width/margin/колонки) НЕ привязан к isCatalogOpen напрямую:
// при открытии он применяется мгновенно, а движение ведёт transform (GPU).
const layoutOpen = ref(isCatalogOpen.value)

const SLIDER_SHIFT_CLASS = "hero-slider__slider_catalog-shifted"
const SLIDER_NO_ANIM_CLASS = "hero-slider__slider_no-transition"

const getSlider = () =>
  document.querySelector<HTMLElement>(".hero-slider__slider")

const setShifted = (shifted: boolean) =>
  getSlider()?.classList.toggle(SLIDER_SHIFT_CLASS, shifted)

const applyClosed = () => {
  // Сброс позы + снятие layout-класса (раскладка в полную ширину).
  // transition отключён — ОДИН reflow в момент вызова, без перевёрстки в кадрах.
  const slider = getSlider()
  if (!slider) return
  slider.classList.add(SLIDER_NO_ANIM_CLASS)
  setShifted(false)
  layoutOpen.value = false
  slider.classList.remove(SLIDER_NO_ANIM_CLASS)
}

watch(isCatalogOpen, (open, wasOpen) => {
  if (!import.meta.client) return
  if (open && !wasOpen) {
    // === Открытие: layout → финал МГНОВЕННО, стартовая GPU-поза «под панелью»,
    // затем transform: -shift → 0 (движение на GPU, без перевёрстки текста) ===
    layoutOpen.value = true
    nextTick(() => {
      const s = getSlider()
      if (!s) return
      s.classList.add(SLIDER_NO_ANIM_CLASS)
      setShifted(true)
      void s.offsetWidth // принудительный reflow: layout и поза в одном состоянии
      s.classList.remove(SLIDER_NO_ANIM_CLASS)
      setShifted(false) // transition transform: -shift → 0 (GPU)
    })
  } else if (!open && wasOpen) {
    // === Закрытие: расширяемся в полную ширину СРАЗУ (панель ещё открыта и
    // перекрывает левую часть — перевёрстка происходит «под ней», один reflow).
    // Затем панель закрывается сама (scale, GPU). НЕТ «выстрела» в конце
    // закрытия, из-за которого контент дёргался ПОСЛЕ закрытия.
    applyClosed()
  }
})

onUnmounted(() => {
  const slider = getSlider()
  if (slider) {
    slider.classList.remove(SLIDER_NO_ANIM_CLASS, SLIDER_SHIFT_CLASS)
  }
})

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
        { 'hero-slider__slider_catalog-open': layoutOpen },
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
          :priority="index === 0 ? 'high' : 'auto'"
          width="742"
          height="498"
        />
        <div class="hero-slider__text-content">
          <span v-if="slide.textTop" class="hero-slider__text-top">
            {{ slide.textTop }}
          </span>
          <h1 v-if="slide.heading && index === 0" id="hero" class="hero-slider__title">
            {{ slide.heading }}
          </h1>
          <h2 v-else-if="slide.heading" class="hero-slider__title">
            {{ slide.heading }}
          </h2>
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
            :to="`/${currentLocale}/products`"
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

  // Открытая desktop-панель каталога — сдвигается ТОЛЬКО слайдер
  // (.hero-slider__slider_catalog-open): секция остаётся на всю ширину,
  // т.к. к ней привязана полоса hero-grids (absolute, вне потока) — она
  // не должна уезжать (план.md §1.2-1.3).
  // Сдвиг — на --catalog-shift (styles.scss: геометрия контейнера шапки +
  // ширина панели + зазор) = «правый край панели + зазор» на любой ширине.
  &__slider {
    // Двухфазный GPU-сдвиг (вариант B): layout (width/margin/колонки) применяется
    // МГНОВЕННО (без transition), движение — только transform (GPU, нижний слой).
    // Промежуточная поза &_catalog-shifted = «сдвинут влево, под панель».
    transition:
      background-color .4s,
      transform var(--transition-duration-fast),
      filter var(--transition-duration);

    // Сброс анимации для «мгновенных» фаз (переключение layout/позы без перехода)
    &_no-transition {
      transition: none !important;
    }

    // GPU-поза «под панелью»: старт открытия / финиш закрытия (translateX, не layout)
    &_catalog-shifted {
      transform: translateX(calc(-1 * var(--catalog-shift)));
    }

    &_is-visible {
      filter: blur(9px);
    }

    // Открытая desktop-панель каталога — финальная РАСКЛАДКА слайдера
    // (без transition; анимацию ведёт transform, см. выше). USlider задаёт
    // .slider { width:100% } — margin поверх НЕ сужает ширину, поэтому width
    // переопределяем: контент занимает оставшееся место.
    &_catalog-open {
      width: calc(100% - var(--catalog-shift));
      margin-inline-start: var(--catalog-shift);
    }

    // Каталог открыт → слайд узкий (сдвиг отдал часть ширины). В базовой раскладке
    // USlider колонка картинки — auto (max-content ~742px), текст получал остаток
    // и «раздавливался» до 48–62px. Переключаем слайд на «сжимаемые» пропорции:
    // обе колонки minmax(0, fr) — картинка уменьшается первой (width:100% +
    // max-width в UImage), тексту всегда достаётся доля. Закрыто (полная ширина) —
    // базовые auto/1fr из USlider, картинка в натуральную ширину.
    &_catalog-open {
      :deep(.slider__slide) {
        grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);

        > * { min-width: 0; }
      }
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
    // Тёмный жёлто-зелёный: #9acd32 на белом даёт 1.9:1 (не проходит AA),
    // #54701a — 5.7:1
    color: #54701a;

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
