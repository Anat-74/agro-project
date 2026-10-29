<script setup lang="ts">
import { shapePresets } from "~/utils/shapePresets";

interface Props {
  /** готовый контур (objectBoundingBox 0..1) — приоритет 1 */
  d?: string;
  /** именованный эталон из shapePresets — приоритет 2 */
  preset?: keyof typeof shapePresets;
}

const props = withDefaults(defineProps<Props>(), {
  d: "",
  preset: "notch-br",
});

// Уникальный id на экземпляр; двоеточия из useId ломают url(#...) в CSS.
const id = useId().replace(/:/g, "");

const d = computed(() => props.d || shapePresets[props.preset] || "");
</script>

<template>
  <div :class="['u-shape', $attrs.class]" :style="{ clipPath: `url(#${id})` }">
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
