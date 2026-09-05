<script setup lang="ts">
const config = useRuntimeConfig();

const props = withDefaults(
  defineProps<{
    // Обязательные
    src?: string;
    alt?: string;

    // Размеры (контекстные — задаются на местах использования)
    width?: string | number;
    height?: string | number;

    // Формат и качество
    format?: "avif" | "webp" | "jpg" | "jpeg" | "png";
    quality?: number;

    // Responsive
    sizes?: string;

    // Загрузка
    loading?: "lazy" | "eager";
    priority?: "high" | "low" | "auto";

    // Strapi
    fromStrapi?: boolean;

    // Плавный переход при загрузке изображения
    smoothLoad?: boolean;

    // Тип изображения (стили берутся из компонента)
    type?:
      | "product"
      | "discount-content"
      | "hero"
      | "avatar"
      | "logo"
      | "icon"
  }>(),
  {
    src: "",
    alt: "",
    width: undefined,
    height: undefined,
    sizes: "",
    format: "avif",
    quality: 85,
    loading: "lazy",
    priority: "auto",
    type: "product",
    fromStrapi: true,
    smoothLoad: true,
  }
);

const emit = defineEmits<{
  load: [Event];
}>();

const loaded = ref(false);

const root = useTemplateRef("root")

// Снимаем блюр: если изображение уже загружено (SSR/кэш) — сразу;
// иначе слушаем нативный load на самом <img> (надёжнее Vue-fallthrough).
onMounted(() => {
  const img = root.value?.querySelector("img")
  if (!img) return
  if (img.complete) {
    loaded.value = true
  } else {
    img.addEventListener("load", () => { loaded.value = true }, { once: true })
  }
})

const onImageLoad = (event: Event) => {
  if (props.smoothLoad) {
    loaded.value = true;
  }
  emit("load", event);
};

// sizes — подсказка для выбора бандла в srcset.
// Приоритет: явный проп > подсказка типа > производная от ширины (ширину задают на местах).
const typeSizes: Record<string, string> = {
  hero: "100vw sm:100vw md:90vw lg:80vw xl:1200px",
  avatar: "200px",
  logo: "100px",
  icon: "64px",
};

const resolvedSizes = computed(() =>
  props.sizes || typeSizes[props.type] || (props.width ? `${props.width}px` : undefined)
);

// Определяем, является ли изображение SVG
const isSvg = computed(() => {
  const ext = props.src?.toLowerCase().split(".").pop();
  return ext === "svg";
});

// Обработка пути
const finalSrc = computed(() => {
  if (props.src?.startsWith("http") || props.src?.startsWith("//")) {
    return props.src;
  }

  if (props.fromStrapi || props.src?.includes("uploads")) {
    return `${config.public.strapi.url}${props.src}`;
  }

  return props.src?.startsWith("/") ? props.src : `/image/${props.src}`;
});
</script>

<template>
  <div
    ref="root"
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
      :sizes="resolvedSizes"
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
    >
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
    // В grid-колонке слайда hero картинка может ужиматься (без overflow)
    min-width: 0;

    // Картинка следует за шириной своей колонки (width:100%) и сжимается первой,
    // но не больше дизайн-ширины 742. Кап — em (toEm): «резиновая» типографика
    // body (style guide §6) — при font-size 16 это 742px, к tablet кап мягко
    // уменьшается вместе со шрифтом. height:auto сохраняет пропорции исходника.
    .app-image__img {
      width: 100%;
      max-width: toEm(742);
      height: auto;
    }

    @media (max-width:$tablet){
      max-width: toRem(540);
    }
  }

  &_product {
    width: 100%;
   //  max-width: toEm(110);
    aspect-ratio: 4 / 3;

    .app-image__img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: toRem(8);
    }

    //===========================================================================================================
    // Все container queries — здесь, в компоненте.
    // Имя контейнера productImage — читается: контейнер адаптирует ИЗОБРАЖЕНИЕ.
    // Брейкпоинты в px (были rem: 16rem=256px, 20rem=320px и т.д.)
   //===========================================================================================================
   @container productImage (max-width: 256px) {
      max-width: toEm(180);
    }

    @container productImage (min-width: 320px) {
      max-width: toEm(220);
    }

    @container productImage (min-width: 448px) {
      max-width: toEm(260);
    }

    @container productImage (min-width: 640px) {
      max-width: toEm(290);
    }

    // Миниатюры — контейнер productThumbImage (пагинация слайдера)
    @container productThumbImage (min-width: 80px) {
      max-width: toEm(80);
    }
  }

  &_discount-content {
    img {
      height: toEm(340);
      border-radius: toRem(6);
      @include adaptiveValue("width", 302, 180, 0, $containerWidth, 1023.98);
    }
  }
}
</style>
