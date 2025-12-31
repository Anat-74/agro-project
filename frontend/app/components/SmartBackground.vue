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

const bgVars = computed(() => ({
  "--avif": `url('${finalPath.value}/${props.name}.avif') type('image/avif')`,
  "--webp": `url('${finalPath.value}/${props.name}.webp') type('image/webp')`,
}));

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
  background: var(--webp) center / cover no-repeat;
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

  /* AVIF для современных браузеров, которые поддерживают AVIF */
  @supports (background-image: image-set(url("test.avif") type("image/avif"))) {
    background: image-set(var(--avif)) center / cover no-repeat;
  }

  /* WebP для браузеров, которые поддерживают WebP, но не AVIF */
  @supports (background-image: image-set(url("test.webp") type("image/webp")))
    and (not (background-image: image-set(url("test.avif") type("image/avif")))) {
    background: image-set(var(--webp)) center / cover no-repeat;
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
