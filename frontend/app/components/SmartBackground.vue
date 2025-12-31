<script setup lang="ts">
interface Props {
  name: string;
  path?: string;
  preload?: boolean;
  fromStrapi?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  path: "/images",
  preload: true,
  fromStrapi: false,
});

const emit = defineEmits<{
  loaded: [];
}>();

// Инициализируем loaded в зависимости от preload
const loaded = ref(false);

// Если preload отключен, сразу устанавливаем loaded в true
if (!props.preload) {
  onMounted(() => {
    loaded.value = true;
  });
}

const config = useRuntimeConfig();

const finalPath = computed(() => {
  if (props.fromStrapi) {
    return `${config.public.strapi.url}${props.path}`;
  }
  return props.path;
});

const bgVars = computed(() => {
  // Проверяем, что изображения существуют и формируем правильный image-set
  const avifUrl = `${finalPath.value}/${props.name}.avif`;
  const webpUrl = `${finalPath.value}/${props.name}.webp`;

  // Возвращаем строку для image-set с правильным порядком: AVIF первый, затем WebP
  return {
    "--image-set": `url('${avifUrl}') type('image/avif'), url('${webpUrl}') type('image/webp')`,
  };
});

const avifSrc = computed(() => `${finalPath.value}/${props.name}.avif`);

const onLoad = () => {
  loaded.value = true;
  emit("loaded");
};
</script>

<template>
  <div
    :class="['smart-bg', { loaded, 'no-transition': !preload }]"
    :style="bgVars"
  >
    <!-- Предзагрузка AVIF -->
    <img
      v-if="preload"
      :src="avifSrc"
      @load="onLoad"
      class="visually-hidden"
      alt=""
    />

    <slot />
  </div>
</template>

<style lang="scss" scoped>
.smart-bg {
  background-image: image-set(var(--image-set));
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: 0;
  filter: blur(10px);
  transition: opacity 0.5s ease, filter 0.5s ease;

  &.loaded {
    opacity: 1;
    filter: blur(0);
  }

  &.no-transition {
    transition: none;
    opacity: 1;
    filter: blur(0);
  }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
