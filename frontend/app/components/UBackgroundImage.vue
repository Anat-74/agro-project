<script setup lang="ts">
const config = useRuntimeConfig();

// Отключаем автоматическое наследование атрибутов
defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    src: string;
    alt?: string;

    // Формат и качество
    format?: "avif" | "webp" | "jpg" | "jpeg" | "png";

    // Strapi
     fromStrapi?: boolean; // Флаг, указывающий, загружается ли изображение из Strapi.

        // Плавный переход при загрузке изображения
     smoothLoad?: boolean;
    
    // Тип фона
    backgroundSize?: "cover" | "contain" | "auto" | "100% 100%"; // CSS свойство background-size.
    backgroundPosition?: string; // CSS свойство background-position.
    backgroundRepeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y"; // CSS свойство background-repeat.

    // Дополнительные стили
    customStyles?: Record<string, string>; // Объект для передачи пользовательских inline-стилей.
  }>(),
  {
    // Значения по умолчанию для пропсов
    format: "avif", // По умолчанию используется формат AVIF для лучшей компрессии и качества.
    fromStrapi: true, // По умолчанию предполагается, что изображения загружаются из Strapi.
    backgroundSize: "cover", // По умолчанию фон покрывает всю область.
    backgroundPosition: "center", // По умолчанию фон центрируется.
    backgroundRepeat: "no-repeat", // По умолчанию фон не повторяется.
  }
);

const finalSrc = computed(() => {
  if (props.src.startsWith("http") || props.src.startsWith("//")) {
    return props.src;
  }

  if (props.fromStrapi || props.src.includes("uploads")) {
    return `${config.public.strapi.url}${props.src}`;
  }

  return props.src.startsWith("/") ? props.src : `/images/${props.src}`;
});

//Вычисляемое свойство для генерации строки для CSS `image-set()`.
const imageSetUrl = computed(() => {
  const baseUrl = finalSrc.value;
  return `url('${baseUrl}') 1x, url('${baseUrl}') 2x`;
});

// Вычисляемое свойство для формирования объекта стилей фона.
const backgroundStyles = computed(() => ({
  // Устанавливаем backgroundImage, используя сгенерированную строку для image-set().
  backgroundImage: `image-set(${imageSetUrl.value})`,
  // Применяем остальные стили фона из пропсов.
  backgroundSize: props.backgroundSize,
  backgroundPosition: props.backgroundPosition,
  backgroundRepeat: props.backgroundRepeat,
  // Добавляем любые пользовательские стили, переданные через customStyles.
  ...props.customStyles,
}));

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
</script>

<template>
  <div
    class="app-background-image"
        :class="[
      'app-background-image',
      {
        'app-background-image_smooth-load': smoothLoad && props.smoothLoad,
        'app-background-image': loaded,
      },
    ]"
    :style="backgroundStyles"
    :aria-label="alt"
    role="img"
    v-bind="{ ...$attrs, class: undefined }"
   @load="onImageLoad"
  />
</template>

<style lang="scss" scoped>
.app-background-image {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
}
</style>
