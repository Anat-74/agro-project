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

// Определяем, является ли изображение SVG
const isSvg = computed(() => {
  const ext = props.src.toLowerCase().split(".").pop();
  return ext === "svg";
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

// Приоритетная загрузка
const computedLoading = computed(() => {
  if (props.priority || props.type === "hero") return "eager";
  return props.loading || configForType.value?.loading || "lazy";
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
      v-if="!isSvg"
      :src="finalSrc"
      :alt="alt"
      :width="width"
      :height="height"
      :sizes="props.sizes || configForType?.sizes"
      :format="props.format"
      :quality="quality"
      :loading="computedLoading"
      :fetchpriority="props.priority || props.type === 'hero' ? 'high' : 'auto'"
      :class="['app-image__img', `app-image__img_${type}`]"
      :aria-hidden="computedAriaHidden"
      decoding="async"
      v-bind="{ ...$attrs, class: undefined }"
      @load="onImageLoad"
    />
    <img
      v-else
      :src="finalSrc"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="'eager'"
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

    & img {
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
