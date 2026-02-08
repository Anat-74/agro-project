<script setup lang="ts">
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
}

const config = useRuntimeConfig();

const props = withDefaults(defineProps<Props>(), {
  variant: "clean",
  effect: "none",
  loading: "none",
  gradient: "none",
  filter: "none",
  hoverEffect: "none",
  sizeMode: "original",
  bgPosition: "center",
});

// Только интерактивные состояния
const isHovered = ref(false);
const isActive = ref(false);

// Функция для удаления расширения файла
const removeExtension = (url: string) => url.replace(/\.(avif|webp)$/i, "");

// Оптимизированные вычисляемые свойства для изображений
const imageUrls = computed(() => {
  let baseImageUrl: string | null = null;
  let retinaImageUrl: string | null = null;

  // Обработка базового изображения
  if (props.src) {
    if (
      props.src.startsWith("http") ||
      props.src.startsWith("//") ||
      props.src.startsWith("/uploads/")
    ) {
      baseImageUrl = props.src.startsWith("/uploads/")
        ? `${config.public.strapi.url}${props.src}`
        : props.src;
    } else {
      baseImageUrl = props.src.startsWith("/")
        ? props.src
        : `/image/${props.src}`;
    }
  }

  // Обработка ретина изображения
  if (props.retinaSrc) {
    if (
      props.retinaSrc.startsWith("http") ||
      props.retinaSrc.startsWith("//")
    ) {
      retinaImageUrl = props.retinaSrc;
    } else {
      retinaImageUrl = `${config.public.strapi.url}${props.retinaSrc}`;
    }
  }

  // Генерация URL для форматов
  const baseWebpUrl = baseImageUrl
    ? `${removeExtension(baseImageUrl)}.webp`
    : null;
  const retinaAvifUrl = retinaImageUrl
    ? `${removeExtension(retinaImageUrl)}.avif`
    : null;

  return {
    baseWebpUrl,
    retinaAvifUrl,
  };
});

const backgroundStyle = computed(() => {
  const styles: any = {
    backgroundPosition: props.bgPosition,
    backgroundRepeat: "no-repeat",
  };

  // Установка backgroundSize в зависимости от режима
  switch (props.sizeMode) {
    case "cover":
      styles.backgroundSize = "cover";
      break;
    case "contain":
      styles.backgroundSize = "contain";
      break;
    case "original":
      styles.backgroundSize = "auto";
      break;
  }

  // Если есть базовое или ретина изображение, добавляем backgroundImage
  const { baseWebpUrl, retinaAvifUrl } = imageUrls.value;
  if (baseWebpUrl || retinaAvifUrl) {
    const imageParts = [];

    // Добавляем базовое изображение, если оно есть
    if (baseWebpUrl) {
      imageParts.push(`url('${baseWebpUrl}') type('image/webp') 1x`);
    }

    // Если указано ретина изображение, добавляем его как 2x
    if (retinaAvifUrl) {
      imageParts.push(`url('${retinaAvifUrl}') type('image/avif') 2x`);
    }

    styles.backgroundImage = `image-set(${imageParts.join(", ")})`;
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
  </div>
</template>

<style lang="scss" scoped>
/* ========== БАЗОВЫЕ СТИЛИ ========== */
.app-bg {
  overflow: hidden;
  position: absolute;
  inset: 0;
  z-index: -1;
  /* ========== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ ========== */
  will-change: transform, opacity;
  /* ========== АНИМАЦИЯ ПОЯВЛЕНИЯ ========== */
  opacity: 1;
  transition: opacity 1.8s ease;

  @starting-style {
    opacity: 0;
  }

  /* ========== ВАРИАНТЫ КОМПОНЕНТА ========== */
  /*.variant-clean - Clean (по умолчанию) - только фон */

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

    @media (prefers-reduced-motion: reduce) {
      animation: app-bg-fade-in 0.3s ease;
    }
  }

  &.effect-zoom {
    animation:
      zoom 15s ease infinite,
      app-bg-fade-in 0.3s ease;

    @media (prefers-reduced-motion: reduce) {
      animation: app-bg-fade-in 0.3s ease;
    }
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

    @media (prefers-reduced-motion: reduce) {
      animation: app-bg-fade-in 0.3s ease;
    }
  }

  &.loading-wave {
    mask: linear-gradient(90deg, #000 25%, #000 50%, #fff 75%);
    mask-size: 200% 100%;
    animation:
      wave 2s infinite linear,
      app-bg-fade-in 0.3s ease;

    @media (prefers-reduced-motion: reduce) {
      animation: app-bg-fade-in 0.3s ease;
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
    filter: brightness(0.7);
    transform: scale(0.98);
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
.smart-bg + *,
.smart-bg > :slotted(*) {
  position: relative;
  z-index: 1;
}
</style>
