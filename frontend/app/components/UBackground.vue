<script setup lang="ts">
import type { BackgroundItem } from '~/types/background'
import BackgroundSwitcher from './BackgroundSwitcher.vue'

interface Props {
  src?: string;
  retinaSrc?: string;
  variant?: "hero" | "card" | "modal" | "clean" | "feature";
  effect?: "parallax" | "kenburns" | "zoom" | "none";
  loading?: "shimmer" | "pulse" | "wave" | "none";
  gradient?: "rainbow" | "sunset" | "ocean" | "violet" | "none";
  filter?: "brightness" | "contrast" | "saturate" | "darken" | "none";
  hoverEffect?: "zoom" | "darken" | "glow" | "lift" | "none";
  sizeMode?: "cover" | "contain" | "original";
  bgPosition?: string;
  backgroundOptions?: BackgroundItem[];
}

const config = useRuntimeConfig();

const props = withDefaults(defineProps<Props>(), {
  src: '',
  retinaSrc: '',
  variant: "clean",
  effect: "none",
  loading: "none",
  gradient: "none",
  filter: "none",
  hoverEffect: "none",
  sizeMode: "original",
  bgPosition: "center",
  backgroundOptions: () => [],
});

const selectedBg = ref<BackgroundItem | null>(null)
const isHovered = ref(false)
const isActive = ref(false)

const isDynamic = computed(() => !!(props.backgroundOptions && props.backgroundOptions.length > 0))

onMounted(() => {
  if (isDynamic.value && props.backgroundOptions) {
    const saved = localStorage.getItem('selectedBackground')
    if (saved) {
      const found = props.backgroundOptions.find(bg => bg.id === saved)
      if (found) { selectedBg.value = found; return }
    }
    const defaultBg = props.backgroundOptions.find(bg => bg.isDefault === true)
    selectedBg.value = defaultBg || props.backgroundOptions[0] || null
  }
})

const onSelectBg = (bg: BackgroundItem) => {
  selectedBg.value = bg
  localStorage.setItem('selectedBackground', bg.id)
}

const imageUrls = computed(() => {
  let baseImageUrl: string | null = null;
  let retinaImageUrl: string | null = null;
  if (isDynamic.value && selectedBg.value) {
    baseImageUrl = selectedBg.value.imageWebp || null
    retinaImageUrl = selectedBg.value.imageAvif || null
  } else {
    if (props.src) {
      baseImageUrl = props.src.startsWith("http") || props.src.startsWith("//") || props.src.startsWith("/uploads/")
        ? (props.src.startsWith("/uploads/") ? `${config.public.strapi.url}${props.src}` : props.src)
        : (props.src.startsWith("/") ? props.src : `/image/${props.src}`);
    }
    if (props.retinaSrc) {
      retinaImageUrl = props.retinaSrc.startsWith("http") || props.retinaSrc.startsWith("//")
        ? props.retinaSrc
        : `${config.public.strapi.url}${props.retinaSrc}`;
    }
  }
  const removeExtension = (url: string) => url.replace(/\.(avif|webp)$/i, "");
  return {
    baseWebpUrl: baseImageUrl ? `${removeExtension(baseImageUrl)}.webp` : null,
    retinaAvifUrl: retinaImageUrl ? `${removeExtension(retinaImageUrl)}.avif` : null,
  };
});

const backgroundStyle = computed(() => {
  const styles: any = { backgroundPosition: props.bgPosition, backgroundRepeat: "no-repeat" };
  switch (props.sizeMode) {
    case "cover": styles.backgroundSize = "cover"; break;
    case "contain": styles.backgroundSize = "contain"; break;
    default: styles.backgroundSize = "auto";
  }
  const { baseWebpUrl, retinaAvifUrl } = imageUrls.value;
  if (baseWebpUrl || retinaAvifUrl) {
    const parts = [];
    if (baseWebpUrl) parts.push(`url('${baseWebpUrl}') type('image/webp') 1x`);
    if (retinaAvifUrl) parts.push(`url('${retinaAvifUrl}') type('image/avif') 2x`);
    styles.backgroundImage = `image-set(${parts.join(", ")})`;
  }
  return styles;
});

// Классы для эффектов
const variantClass = computed(() => `variant-${props.variant}`);
const effectClass = computed(() => `effect-${props.effect}`);
const loadingClass = computed(() => `loading-${props.loading}`);
const gradientClass = computed(() =>
  props.gradient !== "none" ? `gradient-${props.gradient}` : "",
);
const filterClass = computed(() =>
  props.filter !== "none" ? `filter-${props.filter}` : "",
);

const interactiveClass = computed(() => ({
  "is-hovered": isHovered.value,
  "is-active": isActive.value,
  [`hover-${props.hoverEffect}`]:
    isHovered.value && props.hoverEffect !== "none",
}));
</script>

<template>
  <div
    :class="[
      'app-bg',
      variantClass,
      effectClass,
      loadingClass,
      gradientClass,
      filterClass,
      interactiveClass,
    ]"
    :style="backgroundStyle"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="isActive = !isActive"
  >
    <slot />
    <BackgroundSwitcher
      v-if="isDynamic"
      :backgrounds="backgroundOptions || []"
      :selected-id="selectedBg?.id"
      @select="onSelectBg"
    />
  </div>
</template>

<style lang="scss" scoped>
/* ========== БАЗОВЫЕ СТИЛИ ========== */
.app-bg {
  overflow: hidden;
  position: absolute;
  inset: 0;

  /* ========== АНИМАЦИЯ ПОЯВЛЕНИЯ ========== */
  opacity: 1;
  transition: opacity 1.8s ease;

  @starting-style {
    opacity: 0;
  }

  /* ========== ВАРИАНТЫ КОМПОНЕНТА ========== */
  /*.variant-clean - Clean (по умолчанию) - только фон */

  &.variant-clean {
   transition: filter .6s ease, transform .5s;
  }

  /* Hero вариант */
  &.variant-hero {
    min-height: 100vh;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 150px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
      z-index: 1;
    }
  }

  /* Card вариант */
  &.variant-card {
    border-radius: inherit;
  }

  /* Modal вариант */
  &.variant-modal {
    border-radius: inherit;
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
  }

  /* Feature вариант */
  &.variant-feature {
    border-radius: inherit;
  }

  /* ========== ЭФФЕКТЫ ФОНА ========== */
  &.effect-parallax {
    background-attachment: fixed;

    @media (prefers-reduced-motion: reduce) {
      background-attachment: scroll;
    }
  }

  &.effect-kenburns {
    animation:
      kenburns 20s ease infinite,
      app-bg-fade-in 0.3s ease;
  }

  &.effect-zoom {
    animation:
      zoom 15s ease infinite,
      app-bg-fade-in 0.3s ease;
  }

  /* ========== ГЛОБАЛЬНЫЕ АНИМАЦИИ ========== */
  @keyframes app-bg-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* ========== ЭФФЕКТЫ ЗАГРУЗКИ ========== */
  &.loading-shimmer::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent
    );
    animation: shimmer 3.8s infinite;
    z-index: 1;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
      display: none;
    }
  }

  &.loading-pulse {
    animation:
      pulse 2.5s ease-in-out infinite,
      app-bg-fade-in 0.3s ease;
  }

  &.loading-wave {
    mask: linear-gradient(90deg, #000 25%, #000 50%, #fff 75%);
    mask-size: 200% 100%;
    animation:
      wave 2s infinite linear,
      app-bg-fade-in 0.3s ease;
  }

  /* ========== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ ========== */
@media (prefers-reduced-motion: no-preference) {
  &.effect-kenburns,
  &.effect-zoom,
  &.loading-shimmer,
  &.loading-pulse,
  &.loading-wave {
    will-change: transform, opacity;
  }
}

  /* ========== HOVER ЭФФЕКТЫ ========== */
  &.hover-zoom.is-hovered {
    transform: scale(1.03);
  }

  &.hover-darken.is-hovered {
    filter: brightness(0.85);
  }

  &.hover-glow.is-hovered {
    box-shadow:
      0 0 40px rgba(255, 255, 255, 0.3),
      0 20px 60px rgba(0, 0, 0, 0.2);
  }

  &.hover-lift.is-hovered {
    transform: translateY(-8px);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2);
  }

  /* Active состояние */
  &.is-active {
    transition: filter .6s, transform .5s;
    filter: brightness(0.7);
    transform: scale(0.95);
  }

  /* ========== ГРАДИЕНТНЫЕ ОВЕРЛЕИ ========== */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
  }

  &.gradient-rainbow::after {
    background: linear-gradient(
      45deg,
      rgba(255, 0, 0, 0.05) 0%,
      rgba(255, 153, 0, 0.05) 20%,
      rgba(255, 255, 0, 0.05) 40%,
      rgba(0, 255, 0, 0.05) 60%,
      rgba(0, 153, 255, 0.05) 80%,
      rgba(102, 0, 255, 0.05) 100%
    );
    mix-blend-mode: overlay;
  }

  &.gradient-sunset::after {
    background: linear-gradient(
      135deg,
      rgba(255, 126, 95, 0.1) 0%,
      rgba(254, 180, 123, 0.1) 100%
    );
    mix-blend-mode: multiply;
  }

  &.gradient-ocean::after {
    background: linear-gradient(
      135deg,
      rgba(54, 209, 220, 0.1) 0%,
      rgba(91, 134, 229, 0.1) 100%
    );
    mix-blend-mode: screen;
  }

  &.gradient-violet::after {
    background: linear-gradient(
      135deg,
      rgba(138, 43, 226, 0.1) 0%,
      rgba(186, 85, 211, 0.1) 100%
    );
    mix-blend-mode: overlay;
  }

  /* ========== ФИЛЬТРЫ ========== */
  &.filter-brightness {
    filter: brightness(0.9);
  }

  &.filter-contrast {
    filter: contrast(1.1);
  }

  &.filter-saturate {
    filter: saturate(1.2);
  }

  &.filter-darken {
    filter: brightness(0.8) contrast(1.1);
  }
}

/* ========== АНИМАЦИИ ========== */

@keyframes kenburns {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes zoom {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shimmer {
  100% {
    left: 100%;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.95;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes wave {
  100% {
    mask-position: -200% 0;
  }
}

/* ========== ГЛОБАЛЬНЫЕ СТИЛИ ДЛЯ КОНТЕНТА ========== */
.app-bg + *,
.app-bg > :slotted(*) {
  position: relative;
  z-index: 1;
}
</style>
