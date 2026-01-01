<template>
  <div 
    :class="[
      'smart-bg',
      variantClass,
      effectClass,
      loadingClass,
      gradientClass,
      filterClass,
      interactiveClass
    ]"
    :style="backgroundStyle"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="isActive = !isActive"
  >
    <!-- Предзагрузка AVIF -->
    <link
      rel="preload"
      :href="avifUrl"
      as="image"
      type="image/avif"
    />
    
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string;
  path?: string;
  sizes?: boolean;
  variant?: 'hero' | 'card' | 'modal' | 'clean' | 'feature';
  effect?: 'parallax' | 'kenburns' | 'zoom' | 'none';
  loading?: 'shimmer' | 'pulse' | 'wave' | 'none';
  gradient?: 'rainbow' | 'sunset' | 'ocean' | 'violet' | 'none';
  filter?: 'brightness' | 'contrast' | 'saturate' | 'darken' | 'none';
  hoverEffect?: 'zoom' | 'darken' | 'glow' | 'lift' | 'none';
}

const props = withDefaults(defineProps<Props>(), {
  path: "/image",
  sizes: false,
  variant: 'clean',
  effect: 'none',
  loading: 'shimmer',
  gradient: 'none',
  filter: 'none',
  hoverEffect: 'none'
});

// Только интерактивные состояния
const isHovered = ref(false);
const isActive = ref(false);

// URL вычисления
const baseUrl = computed(() => `${props.path}/${props.name}`);
const avifUrl = computed(() => `${baseUrl.value}.avif`);
const webpUrl = computed(() => `${baseUrl.value}.webp`);

// Классы для эффектов
const variantClass = computed(() => `variant-${props.variant}`);
const effectClass = computed(() => `effect-${props.effect}`);
const loadingClass = computed(() => `loading-${props.loading}`);
const gradientClass = computed(() => props.gradient !== 'none' ? `gradient-${props.gradient}` : '');
const filterClass = computed(() => props.filter !== 'none' ? `filter-${props.filter}` : '');

const interactiveClass = computed(() => ({
  'is-hovered': isHovered.value,
  'is-active': isActive.value,
  [`hover-${props.hoverEffect}`]: isHovered.value && props.hoverEffect !== 'none'
}));

// Стиль фона (без opacity, он теперь в CSS)
const backgroundStyle = computed(() => {
  const background = `image-set(
    url('${avifUrl.value}') type("image/avif"),
    url('${webpUrl.value}') type("image/webp")
  ) center / cover no-repeat`;
  
  const style: any = {
    background
  };
  
  if (props.sizes) {
    style['--avif-2x-url'] = `${baseUrl.value}@2x.avif`;
    style['--webp-2x-url'] = `${baseUrl.value}@2x.webp`;
  }
  
  return style;
});
</script>

<style lang="scss" scoped>
.smart-bg {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  /* ========== АНИМАЦИЯ ПОЯВЛЕНИЯ ========== */
  /* Современные браузеры (Chrome 111+, Edge 111+) */
  @starting-style {
    opacity: 0;
  }
  opacity: 1;
  transition: opacity 2.3s ease;
  
  /* ========== ВАРИАНТЫ КОМПОНЕНТА ========== */
  &.variant-hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 150px;
      background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
      z-index: 1;
    }
  }
  
  &.variant-card {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  }
  
  &.variant-modal {
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(12px);
  }
  
  &.variant-clean {
  }
  
  &.variant-feature {
    border-radius: 16px;
    padding: 40px;
    text-align: center;
  }
  
  /* ========== ЭФФЕКТЫ ФОНА ========== */
  &.effect-parallax {
    background-attachment: fixed;
    
    @media (prefers-reduced-motion: reduce) {
      background-attachment: scroll;
    }
  }
  
  &.effect-kenburns {
    animation: kenburns 20s ease infinite, smart-bg-fade-in 0.3s ease;
  }
  
  &.effect-zoom {
    animation: zoom 15s ease infinite, smart-bg-fade-in 0.3s ease;
  }
  
  /* ========== ЭФФЕКТЫ ЗАГРУЗКИ ========== */
  &.loading-shimmer::before {
    content: '';
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
    animation: pulse 2.5s ease-in-out infinite, smart-bg-fade-in 0.3s ease;
  }
  
  &.loading-wave {
    mask: linear-gradient(90deg, #000 25%, #0005 50%, #000 75%);
    mask-size: 200% 100%;
    animation: wave 2s infinite linear, smart-bg-fade-in 0.3s ease;
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
  
  /* ========== RETINA ПОДДЕРЖКА ========== */
  @media (min-resolution: 2dppx) {
    &[style*="--avif-2x-url"] {
      background: 
        image-set(
          url(var(--avif-2x-url)) type("image/avif") 2x,
          url(var(--webp-2x-url)) type("image/webp") 2x
        ) center / cover no-repeat;
    }
  }
  
  /* ========== ГРАДИЕНТНЫЕ ОВЕРЛЕИ ========== */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
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
    background: linear-gradient(135deg, rgba(255, 126, 95, 0.1) 0%, rgba(254, 180, 123, 0.1) 100%);
    mix-blend-mode: multiply;
  }
  
  &.gradient-ocean::after {
    background: linear-gradient(135deg, rgba(54, 209, 220, 0.1) 0%, rgba(91, 134, 229, 0.1) 100%);
    mix-blend-mode: screen;
  }
  
  &.gradient-violet::after {
    background: linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(186, 85, 211, 0.1) 100%);
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
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes zoom {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

@keyframes shimmer {
  100% { left: 100%; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.95; }
  50% { opacity: 0.7; }
}

@keyframes wave {
  100% { mask-position: -200% 0; }
}

/* Улучшенное позиционирование контента */
.smart-bg > :slotted(*) {
  position: relative;
  z-index: 2;
}

/* Доступность */
@media (prefers-reduced-motion: reduce) {
  .smart-bg {
    animation: none !important;
    @starting-style {
      opacity: 1;
    }
    opacity: 1;
  }
}
</style>
//=============================================



<!-- <template>
  <div 
    :class="['smart-bg', { loaded }]"
    :style="backgroundStyle"
  >
    <link
      v-if="preload"
      rel="preload"
      :href="avifUrl"
      as="image"
      type="image/avif"
      @load="loaded = true"
    />
    
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string;
  path?: string;
  preload?: boolean;
  sizes?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  path: "/image",
  preload: false,
  sizes: false
});

const loaded = ref(!props.preload);

const baseUrl = computed(() => `${props.path}/${props.name}`);
const avifUrl = computed(() => `${baseUrl.value}.avif`);
const webpUrl = computed(() => `${baseUrl.value}.webp`);

// ИСПРАВЛЕННАЯ ЛОГИКА: добавляем WebP перед image-set
const backgroundStyle = computed(() => {
  // Ключевое изменение: добавляем WebP перед image-set
  const background = `
    url('${webpUrl.value}') center / cover no-repeat,
    image-set(
      url('${avifUrl.value}') type("image/avif"),
      url('${webpUrl.value}') type("image/webp")
    ) center / cover no-repeat
  `.replace(/\s+/g, ' ').trim();
  
  const style: any = {
    background,
    opacity: loaded.value ? '1' : '0',
    transition: 'opacity 0.3s ease'
  };
  
  if (props.sizes) {
    style['--avif-2x-url'] = `${baseUrl.value}@2x.avif`;
    style['--webp-2x-url'] = `${baseUrl.value}@2x.webp`;
  }
  
  return style;
});
</script>

<style lang="scss" scoped>
.smart-bg {
  @media (min-resolution: 2dppx) {
    &[style*="--avif-2x-url"] {
      background: 
        url(var(--webp-2x-url)) center / cover no-repeat,
        image-set(
          url(var(--avif-2x-url)) type("image/avif") 2x,
          url(var(--webp-2x-url)) type("image/webp") 2x
        ) center / cover no-repeat;
    }
  }
}
</style> -->
//=============================================



<!-- <template>
  <div 
    :class="['smart-bg', { loaded }]"
    :style="backgroundStyle"
  >
    <link
      v-if="preload"
      rel="preload"
      :href="avifUrl"
      as="image"
      type="image/avif"
      @load="loaded = true"
    />
    
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string;
  path?: string;
  preload?: boolean;
  sizes?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  path: "/image",
  preload: false,
  sizes: false
});

const loaded = ref(!props.preload);

const baseUrl = computed(() => `${props.path}/${props.name}`);
const avifUrl = computed(() => `${baseUrl.value}.avif`);
const webpUrl = computed(() => `${baseUrl.value}.webp`);

const backgroundStyle = computed(() => {
  // ТОЛЬКО image-set - без дублирования WebP
  const background = `
    image-set(
      url('${avifUrl.value}') type("image/avif"),
      url('${webpUrl.value}') type("image/webp")
    ) center / cover no-repeat
  `.replace(/\s+/g, ' ').trim();
  
  const style: any = {
    background,
    opacity: loaded.value ? '1' : '0',
    transition: 'opacity 0.3s ease'
  };
  
  if (props.sizes) {
    style['--avif-2x-url'] = `${baseUrl.value}@2x.avif`;
    style['--webp-2x-url'] = `${baseUrl.value}@2x.webp`;
  }
  
  return style;
});
</script>

<style lang="scss" scoped>
.smart-bg {
  @media (min-resolution: 2dppx) {
    &[style*="--avif-2x-url"] {
      background: 
        image-set(
          url(var(--avif-2x-url)) type("image/avif") 2x,
          url(var(--webp-2x-url)) type("image/webp") 2x
        ) center / cover no-repeat;
    }
  }
}
</style> -->
//======================================================



<!-- <template>
  <div 
    :class="['smart-bg', { loaded }]"
    :style="backgroundStyle"
  >
    <link
      v-if="preload"
      rel="preload"
      :href="avifUrl"
      as="image"
      type="image/avif"
      @load="loaded = true"
    />
    
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string;      // Имя файла без расширения
  path?: string;     // Путь к папке
  preload?: boolean; // Предзагрузка AVIF
  sizes?: boolean;   // Включить ретина (@2x) изображения
}

const props = withDefaults(defineProps<Props>(), {
  path: "/image",
  preload: false,
  sizes: false
});

const loaded = ref(!props.preload);

// Базовые URL
const baseUrl = computed(() => `${props.path}/${props.name}`);
const avifUrl = computed(() => `${baseUrl.value}.avif`);
const webpUrl = computed(() => `${baseUrl.value}.webp`);

// Генерируем background
const backgroundStyle = computed(() => {
  // Базовый background (WebP + AVIF через image-set)
  const baseBackground = `
    url('${webpUrl.value}') center / cover no-repeat,
    image-set(
      url('${avifUrl.value}') type("image/avif"),
      url('${webpUrl.value}') type("image/webp")
    ) center / cover no-repeat
  `.replace(/\s+/g, ' ').trim();
  
  const style: any = {
    background: baseBackground,
    opacity: loaded.value ? '1' : '0',
    transition: 'opacity 0.3s ease'
  };
  
  // Добавляем ретина URL если включено
  if (props.sizes) {
    style['--avif-2x-url'] = `${baseUrl.value}@2x.avif`;
    style['--webp-2x-url'] = `${baseUrl.value}@2x.webp`;
  }
  
  return style;
});



</script>

<style lang="scss" scoped>
.smart-bg {
  /* Базовые стили уже в inline-style */
  
  /* Ретина поддержка (2x DPI экраны) */
  /* Если в элементе есть переменные --avif-2x-url и --webp-2x-url */
  @media (min-resolution: 2dppx) {
    &[style*="--avif-2x-url"] {
      background: 
        url(var(--webp-2x-url)) center / cover no-repeat,
        image-set(
          url(var(--avif-2x-url)) type("image/avif") 2x,
          url(var(--webp-2x-url)) type("image/webp") 2x
        ) center / cover no-repeat;
    }
  }
}
</style> -->

//==========================================

<!-- <template>
  <div 
    :class="['smart-bg', { loaded }]"
    :style="backgroundStyle"
  >
    <link
      v-if="preload"
      rel="preload"
      :href="avifUrl"
      as="image"
      type="image/avif"
      @load="loaded = true"
    />
    
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string;
  path?: string;
  preload?: boolean;
  sizes?: boolean; // Включить ретина поддержку
}

const props = withDefaults(defineProps<Props>(), {
  path: "/image",
  preload: false,
  sizes: false
});

const loaded = ref(!props.preload);

// Базовые URL
const avifUrl = computed(() => `${props.path}/${props.name}.avif`);
const webpUrl = computed(() => `${props.path}/${props.name}.webp`);

// Ретина URL (если включено)
const avif2xUrl = computed(() => `${props.path}/${props.name}@2x.avif`);
const webp2xUrl = computed(() => `${props.path}/${props.name}@2x.webp`);

// Генерируем background с учетом ретина
const backgroundStyle = computed(() => {
  if (props.sizes) {
    // С ретина поддержкой
    return {
      // Базовый вариант
      background: `
        url('${webpUrl.value}') center / cover no-repeat,
        image-set(
          url('${avifUrl.value}') type("image/avif"),
          url('${webpUrl.value}') type("image/webp")
        ) center / cover no-repeat
      `.replace(/\s+/g, ' ').trim(),
      opacity: loaded.value ? '1' : '0',
      transition: 'opacity 0.3s ease',
      // Добавляем переменные для CSS медиа-запроса
      '--avif-url': avifUrl.value,
      '--webp-url': webpUrl.value,
      '--avif-2x-url': avif2xUrl.value,
      '--webp-2x-url': webp2xUrl.value
    };
  } else {
    // Без ретина поддержки
    return {
      background: `
        url('${webpUrl.value}') center / cover no-repeat,
        image-set(
          url('${avifUrl.value}') type("image/avif"),
          url('${webpUrl.value}') type("image/webp")
        ) center / cover no-repeat
      `.replace(/\s+/g, ' ').trim(),
      opacity: loaded.value ? '1' : '0',
      transition: 'opacity 0.3s ease'
    };
  }
});
</script>

<style lang="scss" scoped>
.smart-bg {
  /* Базовые стили уже в inline-style */
  
  /* Ретина поддержка через CSS медиа-запрос */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    & {
      background: 
        url('var(--webp-2x-url)') center / cover no-repeat,
        image-set(
          url('var(--avif-2x-url)') type("image/avif") 2x,
          url('var(--webp-2x-url)') type("image/webp") 2x
        ) center / cover no-repeat;
    }
  }
}
</style> -->