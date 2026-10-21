<script setup lang="ts">
/**
 * Локальная (файловая) иконка из /public/my-icons/<name>.svg.
 *
 * Почему маска, а не <img> и не <Icon>:
 *  - <img> нельзя перекрасить под цвет текста;
 *  - @nuxt/icon для кастомных коллекций может уходить в рантайм-фолбэк
 *    (/api/_nuxt_icon/...), из-за чего на месте иконки мелькает пустой бокс;
 *  - инлайн-SVG в шаблоне раздувает разметку и требует вставки исходника.
 *
 * Здесь SVG грузится браузером как обычный файл (кэшируется, прекэшируется PWA),
 * а `background-color: currentColor` + `mask-image` дают перекраску цветом текста.
 * Иконка должна быть силуэтом (альфа-канал); многоцветные сюда не подходят.
 */
interface Props {
  // Имя файла без .svg из /my-icons, например "icon-by-regular"
  name?: string
  // Прямой путь к SVG (приоритетнее name), например "/image/logo.svg"
  src?: string
  // Размер (width/height), по умолчанию 1em от текущего шрифта
  size?: string
  // Необязательные раздельные размеры
  width?: string
  height?: string
  // Если задан — иконка доступна скринридеру (role="img")
  alt?: string
}

const props = withDefaults(defineProps<Props>(), {
  name: "",
  src: "",
  size: "1em",
  width: "",
  height: "",
  alt: "",
})

const iconStyle = computed(() => ({
  "--icon-src": `url("${props.src || `/my-icons/${props.name}.svg`}")`,
  "--icon-w": props.width || props.size,
  "--icon-h": props.height || props.size,
}))
</script>

<template>
  <span
    class="icon-local"
    :style="iconStyle"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
    :aria-hidden="alt ? undefined : 'true'"
  />
</template>

<style lang="scss" scoped>
.icon-local {
  display: inline-block;
  flex-shrink: 0;
  width: var(--icon-w);
  height: var(--icon-h);
  // Цвет иконки = цвет текста в месте использования
  background-color: currentColor;
  -webkit-mask-image: var(--icon-src);
  mask-image: var(--icon-src);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
  vertical-align: -0.12em;
}
</style>
