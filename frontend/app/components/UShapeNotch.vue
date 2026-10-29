<script setup lang="ts">
import { shapePath, type ShapePreset } from "~/utils/shapePath";
import { shapePresets } from "~/utils/shapePresets";

interface Props {
  /** готовый контур (objectBoundingBox 0..1) — приоритет 1 */
  d?: string;
  /** именованный эталон из shapePresets — приоритет 2 */
  preset?: ShapePreset;
  /** радиус внешних углов (0..1) — приоритет 3 */
  r?: number;
  /** размер выреза (0..1) */
  s?: number;
  /** радиус вогнутой дуги (0..1) */
  cr?: number;
}

const props = withDefaults(defineProps<Props>(), {
  d: "",
  preset: "notch-br",
  r: 0.03,
  s: 0.18,
  cr: 0.03,
});

// уникальный id на экземпляр, чтобы clipPath не конфликтовали.
// useId() отдаёт ":r0:" — двоеточия ломают url(#id) в clip-path, поэтому чистим.
const id = useId().replace(/:/g, "");

// приоритет: свой контур → пресет-эталон → параметрическая генерация
const d = computed(() => {
  if (props.d) return props.d;
  const presetD = shapePresets[props.preset];
  if (presetD) return presetD;
  return shapePath(props.preset, { r: props.r, s: props.s, cr: props.cr });
});
</script>

<template>
  <div class="u-shape" :style="{ clipPath: `url(#${id})` }">
    <svg class="u-shape__defs" aria-hidden="true" width="0" height="0">
      <defs>
        <clipPath :id="id" clipPathUnits="objectBoundingBox">
          <path :d="d" />
        </clipPath>
      </defs>
    </svg>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.u-shape {
  position: relative;
  width: 100%;
  height: 100%;
}

.u-shape__defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
