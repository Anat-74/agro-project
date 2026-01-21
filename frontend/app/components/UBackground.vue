<script setup lang="ts">
interface Props {
  src?: string; // Путь к базовому изображению (в public директории)
  retinaSrc?: string; // Путь к ретина изображению (из Strapi)
  variant?: "hero" | "card" | "modal" | "clean" | "feature";
  effect?: "parallax" | "kenburns" | "zoom" | "none";
  loading?: "shimmer" | "pulse" | "wave" | "none";
  gradient?: "rainbow" | "sunset" | "ocean" | "violet" | "none";
  filter?: "brightness" | "contrast" | "saturate" | "darken" | "none";
  hoverEffect?: "zoom" | "darken" | "glow" | "lift" | "none";
  shouldPreload?: boolean;
}

const config = useRuntimeConfig();

const props = withDefaults(defineProps<Props>(), {
  variant: "clean",
  effect: "none",
  loading: "none",
  gradient: "none",
  filter: "none",
  hoverEffect: "none",
  shouldPreload: false,
});

// Только интерактивные состояния
const isHovered = ref(false);
const isActive = ref(false);

// Функция для удаления расширения файла
const removeExtension = (url: string) =>
  url.replace(/\.(avif|webp|png|jpg|jpeg)$/i, "");

// Формирование URL для базовых изображений (из public)
const baseImageUrl = computed(() => {
  if (!props.src) return null;

  if (props.src?.startsWith("http") || props.src?.startsWith("//")) {
    return props.src;
  }

  // Если начинается с /, используем как есть, иначе добавляем /image/
  return props.src?.startsWith("/") ? props.src : `/image/${props.src}`;
});

// Вычисляем базовый URL для WebP (единственный формат для базовых изображений)
const baseBaseUrl = computed(() => {
  if (!baseImageUrl.value) return null;
  return removeExtension(baseImageUrl.value);
});
const baseWebpUrl = computed(() => {
  if (!baseBaseUrl.value) return null;
  return `${baseBaseUrl.value}.webp`;
});

// Формирование URL для ретина изображения (из Strapi)
const retinaImageUrl = computed(() => {
  if (!props.retinaSrc) return null;

  if (props.retinaSrc.startsWith("http") || props.retinaSrc.startsWith("//")) {
    return props.retinaSrc;
  }

  return `${config.public.strapi.url}${props.retinaSrc}`;
});

// Вычисляем ретина URL для AVIF
const retinaBaseUrl = computed(() => {
  if (!retinaImageUrl.value) return null;
  return removeExtension(retinaImageUrl.value);
});

const retinaAvifUrl = computed(() => {
  if (!retinaBaseUrl.value) return null;
  return `${retinaBaseUrl.value}.avif`;
});

// Формирование CSS style с image-set
const backgroundStyle = computed(() => {
  const styles: any = {
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  };

  // Проверяем наличие изображений для формирования backgroundImage
  const hasImages = baseWebpUrl.value || retinaAvifUrl.value;

  if (hasImages) {
    let images = "";

    // Добавляем базовое изображение, если оно есть
    if (baseWebpUrl.value) {
      images = `url('${baseWebpUrl.value}') type("image/webp") 1x`;
    }

    // Если указано ретина изображение, добавляем его как 2x
    if (retinaAvifUrl.value) {
      if (images) {
        images = `url('${retinaAvifUrl.value}') type("image/avif") 2x, ${images}`;
      } else {
        images = `url('${retinaAvifUrl.value}') type("image/avif") 2x`;
      }
    }

    styles.backgroundImage = `image-set(${images})`;
  } else {
    styles.backgroundImage = undefined;
  }

  return styles;
});

// Классы для эффектов
const variantClass = computed(() => `variant-${props.variant}`);
const effectClass = computed(() => `effect-${props.effect}`);
const loadingClass = computed(() => `loading-${props.loading}`);
const gradientClass = computed(() =>
  props.gradient !== "none" ? `gradient-${props.gradient}` : ""
);
const filterClass = computed(() =>
  props.filter !== "none" ? `filter-${props.filter}` : ""
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
    <link
      rel="preload"
      v-if="shouldPreload && retinaAvifUrl"
      :href="retinaAvifUrl"
      as="image"
      type="image/avif"
    />
    <link
      rel="preload"
      v-else-if="shouldPreload && baseWebpUrl"
      :href="baseWebpUrl"
      as="image"
      type="image/webp"
    />
    <slot />
  </div>
</template>

<style lang="scss" scoped>
/* ========== БАЗОВЫЕ СТИЛИ ========== */
.app-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;

  /* ========== АНИМАЦИЯ ПОЯВЛЕНИЯ ========== */
  opacity: 1;
  transition: opacity 2s ease;

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
