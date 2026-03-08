<script setup lang="ts">
const config = useRuntimeConfig();

const props = withDefaults(
  defineProps<{
    // Обязательные
    src?: string;
    alt?: string;

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
      | "discount-content"
      | "product"
      | "discount-product"
      | "hero"
      | "avatar"
      | "thumbnail"
      | "logo"
      | "icon"
  }>(),
  {
    format: "avif",
    quality: 85,
    loading: "lazy",
    type: "product",
    fromStrapi: true,
    smoothLoad: true,
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
};

// Конфигурация по типам
const typeConfigs: Record<string, ImageTypeConfig> = {
  // Главное изображение на странице
  hero: {
    sizes: "100vw sm:100vw md:90vw lg:80vw xl:1200px",
  },
  // Изображение-обложка для элементов (подкатегории, продукты и т.д.)
  product: {
     quality: 80,
   //  sizes: "100vw xs:100vw sm:33.33vw md:25vw lg:20vw xl:20vw"
   },
   discountProduct: {
      sizes: "50vw md:50vw xl:33.33vw"
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
   //  sizes: "200px",
  },
  // Логотипы брендов и компаний
  logo: {
    quality: 100,
    sizes: "100px",
  },
  // Иконки интерфейса
  icon: {
    quality: 100,
    sizes: "64px",
  },
};

const configForType = computed(() => typeConfigs[props.type]);

// Определяем, является ли изображение SVG
const isSvg = computed(() => {
  const ext = props.src?.toLowerCase().split(".").pop();
  return ext === "svg";
});

// Обработка пути
const finalSrc = computed(() => {
  // Если уже полный URL
  if (props.src?.startsWith("http") || props.src?.startsWith("//")) {
    return props.src;
  }

  // Если из Strapi
  if (props.fromStrapi || props.src?.includes("uploads")) {
    return `${config.public.strapi.url}${props.src}`;
  }

  // Локальные изображения
  return props.src?.startsWith("/") ? props.src : `/image/${props.src}`;
});
</script>

<template>
  <div
    :class="[
      'app-image',
      `app-image_${type}`,
      {
        'app-image_smooth-load': smoothLoad && props.smoothLoad,
         'app-image_loaded': loaded
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
      :quality="props.quality"
      :loading="props.loading"
      :fetchpriority="props.priority"
      :class="['app-image__img', `app-image__img_${type}`]"
      decoding="async"
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
      decoding="async"
      @load="onImageLoad"
    />
  </div>
</template>

<style lang="scss" scoped>
.app-image {
   img {
      object-fit: cover;
   }

  &_smooth-load {
    filter: blur(4px);
    transition: filter .4s ease;
  }

  &_loaded {
      filter: blur(0);
    }

  &__img {
    display: block;
    max-width: 100%;
    height: auto;

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

  &_hero {
   @media (max-width:$tablet){
      max-width: toRem(540);
   }
  }

  &_product {
   flex: 1 1 auto;
   

       max-width: toEm(180); 

  }

    &_discount-content {
   @media (max-width:$tablet){
      display: none;
   }

   img {
      height: toEm(417);
      border-radius: toRem(6);
      @include adaptiveValue("width", 302, 194, 0, $containerWidth, 1023.98);
   }
  }

  &_discount-product {
      max-width: toEm(100);
  }
}
</style>
