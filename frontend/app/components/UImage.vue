<script setup lang="ts">
const config = useRuntimeConfig();

// Отключаем автоматическое наследование атрибутов
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

    // Strapi
    fromStrapi?: boolean;

    // Плавный переход при загрузке изображения
    smoothLoad?: boolean;

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
  }>(),
  {
    format: "avif",
    quality: 85,
    loading: "lazy",
    type: "cover",
    fromStrapi: true,
    smoothLoad: false,
  }
);

// Обработчик загрузки изображения
const emit = defineEmits<{
  load: [Event];
}>();

// Обработчик загрузки изображения
const loaded = ref(false);

const onImageLoad = (event: Event) => {
  if (props.smoothLoad) {
    loaded.value = true;
  }
  emit("load", event);
};

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
  // Главное изображение на странице, обычно крупный баннер в шапке
  hero: {
    loading: "eager",
    quality: 75,
    sizes: "100vw",
    priority: true,
  },
  // Изображение-обложка для элементов (подкатегории, продукты и т.д.)
  cover: {
    loading: "eager",
    quality: 80,
    sizes: "100vw sm:100vw md:90vw lg:80vw xl:1200px",
  },
  // Изображения пользователей/аватарки
  avatar: {
    quality: 90,
    sizes: "200px",
  },
  // Миниатюры для галерей, превью
  thumbnail: {
    quality: 85,
    sizes: "200px",
  },
  // Основные изображения в текстовом контенте
  content: {
    quality: 85,
    sizes: "100vw",
  },
  // Логотипы брендов и компаний
  logo: {
    quality: 100,
    sizes: "200px",
  },
  // Иконки интерфейса
  icon: {
    quality: 100,
    sizes: "64px",
  },
  // Декоративные фоновые изображения
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

  const width = Number(props.width ?? 1200);
  const maxWidth = Math.min(width, 1200);

  if (width <= 200) {
    return `${width}px`;
  }

  return `100vw sm:100vw md:90vw lg:80vw xl:${maxWidth}px`;
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
  <div
    :class="[
      'app-image',
      `app-image_${type}`,
      {
        'app-image_smooth-load': smoothLoad && props.smoothLoad,
        'app-image_loaded': loaded,
      },
    ]"
  >
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
      :class="['app-image__img', `app-image__img_${type}`]"
      :aria-hidden="computedAriaHidden"
      decoding="async"
      v-bind="{ ...$attrs, class: undefined }"
      @load="onImageLoad"
    />
  </div>
</template>

<style lang="scss" scoped>
.app-image {
  &_smooth-load {
    filter: blur(4px);
    transition: filter 0.4s ease;

    &.app-image_loaded {
      filter: blur(0);
    }
  }

  &__img {
    display: block;
    max-width: 100%;
    height: auto;

    :deep(img) {
      width: 100%;
      height: 100%;
      display: block;
    }

    &_cover,
    &_hero,
    &_avatar {
      :deep(img) {
        object-fit: cover;
      }
    }

    &_contain,
    &_logo {
      :deep(img) {
        object-fit: contain;
      }
    }
  }

  // Для фоновых изображений
  &_background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
}
</style>
