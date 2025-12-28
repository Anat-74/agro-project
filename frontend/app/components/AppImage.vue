<script setup lang="ts">
// Отключаем автоматическое наследование атрибутов для избежания дублирования классов
defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    // Обязательные
    src: string;
    alt: string;

    // Размеры
    width?: string | number;
    height?: string | number;

    // Формат и качество
    format?: "avif" | "webp" | "jpg" | "jpeg" | "png";
    quality?: number;

    // Responsive
    sizes?: string;

    // Загрузка
    loading?: "lazy" | "eager";
    priority?: boolean;

    // Тип изображения
    type?:
      | "content"
      | "cover"
      | "hero"
      | "avatar"
      | "thumbnail"
      | "logo"
      | "icon"
      | "background";

    // Strapi
    fromStrapi?: boolean;
  }>(),
  {
    format: undefined,
    quality: 85,
    loading: "lazy",
    type: "content",
    fromStrapi: false,
  }
);

const config = useRuntimeConfig();

// Типы для конфигурации
type ImageTypeConfig = {
  loading?: "lazy" | "eager";
  quality?: number;
  sizes?: string;
  priority?: boolean;
  ariaHidden?: boolean;
};

// Конфигурация по типам
const typeConfigs: Record<string, ImageTypeConfig> = {
  hero: {
    loading: "eager",
    quality: 75,
    sizes: "100vw",
    priority: true,
  },
  cover: {
    loading: "eager",
    quality: 80,
    sizes: "100vw",
  },
  avatar: {
    quality: 90,
    sizes: "200px",
  },
  thumbnail: {
    quality: 85,
    sizes: "400px",
  },
  content: {
    quality: 85,
    sizes: "100vw sm:100vw md:95vw lg:90vw xl:1200px",
  },
  logo: {
    quality: 100,
    sizes: "200px",
  },
  icon: {
    quality: 100,
    sizes: "64px",
  },
  background: {
    quality: 70,
    sizes: "100vw",
    ariaHidden: true,
  },
};

const configForType = computed(() => typeConfigs[props.type]);

// Вычисляем aria-hidden только для background
const computedAriaHidden = computed(() => {
  if (props.type === "background") {
    return true;
  }
  return undefined;
});

// Автоматическое определение формата
const computedFormat = computed(() => {
  if (props.format) return props.format;

  const src = props.src.toLowerCase();
  const ext = src.split(".").pop();

  // SVG всегда оставляем как есть
  if (ext === "svg") return undefined;

  // PNG для логотипов иконок (но не для изображений из Strapi)
  const isLogo = src.includes("logo") || src.includes("brand");
  const isIcon =
    src.includes("icon") || (props.width && Number(props.width) <= 100);
  const isUi =
    src.includes("ui-") ||
    src.includes("screenshot") ||
    src.includes("interface");

  // Если это Strapi изображение, то используем AVIF для всех, кроме логотипов и иконок
  if (props.fromStrapi) {
    // Для логотипов и иконок из Strapi все равно используем PNG
    if ((isLogo || isIcon) && ext === "png") {
      return "png";
    }
    // Для остальных изображений из Strapi используем AVIF
    return "avif";
  }

  // Для обычных изображений вне Strapi
  if (
    (ext === "png" && (isLogo || isIcon || isUi)) ||
    props.type === "logo" ||
    props.type === "icon"
  ) {
    return "png";
  }

  // Для всего остального - AVIF
  return "avif";
});

// Автоматические sizes
const computedSizes = computed(() => {
  if (props.sizes) return props.sizes;
  if (configForType.value?.sizes) return configForType.value?.sizes;

  const width = Number(props.width) || 1200;

  if (width <= 400) {
    return `${width}px`;
  }

  return `(max-width: 768px) 100vw, (max-width: 1200px) ${Math.min(
    width,
    1200
  )}px, ${width}px`;
});

// Модификаторы
const mergedModifiers = computed(() => {
  const modifiers: Record<string, any> = {};

  return modifiers;
});

// Приоритетная загрузка
const computedLoading = computed(() => {
  if (props.priority || props.type === "hero") return "eager";
  return props.loading || configForType.value?.loading || "lazy";
});

// Приоритет загрузки
const computedFetchPriority = computed(() => {
  if (props.priority || props.type === "hero") return "high";
  return "auto";
});

// Обработка пути
const finalSrc = computed(() => {
  // Если уже полный URL
  if (props.src.startsWith("http") || props.src.startsWith("//")) {
    return props.src;
  }

  // Если из Strapi
  if (props.fromStrapi || props.src.includes("uploads")) {
    return `${config.public.strapi.url}${props.src}`;
  }

  // Локальные изображения
  return props.src.startsWith("/") ? props.src : `/images/${props.src}`;
});
</script>

<template>
  <NuxtImg
    :src="finalSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :sizes="computedSizes"
    :format="computedFormat"
    :quality="quality"
    :loading="computedLoading"
    :fetchpriority="computedFetchPriority"
    :modifiers="mergedModifiers"
    :class="['app-image', type, $attrs.class]"
    :aria-hidden="computedAriaHidden"
    decoding="async"
    v-bind="{ ...$attrs, class: undefined }"
  />
</template>

<style lang="scss" scoped>
.app-image {
  display: block;
  max-width: 100%;
  height: auto;
}

.app-image :deep(img) {
  width: 100%;
  height: 100%;
  display: block;
}

// Object-fit по умолчанию
.app-image.cover :deep(img),
.app-image.hero :deep(img),
.app-image.avatar :deep(img) {
  object-fit: cover;
}

.app-image.contain :deep(img),
.app-image.logo :deep(img) {
  object-fit: contain;
}

// Для фоновых изображений
.app-image.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
