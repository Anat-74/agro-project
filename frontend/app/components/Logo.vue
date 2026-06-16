<script setup lang="ts">
const { currentLocale } = useLocale();
const t = computed(() => logoTranslations[currentLocale.value])
import { logoTranslations } from "~/locales/logo";

interface Props {
  global: GlobalData;
  width?: string | number;
  height?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 45,
  height: 45,
});
</script>

<template>
  <NuxtLink
    class="logo-link"
    :to="`/${currentLocale}`"
    :aria-label="t.label"
  >
    <UImage
      class="logo-link__image"
      v-if="props.global?.footer?.logo?.url"
      :src="props.global?.footer?.logo?.url"
      :smooth-load="false"
      :width="props.width"
      :height="props.height"
      :alt="t.alt"
      type="icon"
    />
  </NuxtLink>
</template>

<style lang="scss" scoped>
.logo-link {
  border-radius: 50%;
  background-color: var(--warning-color);
  transition: background-color var(--transition-duration);

  @include hover {
   background-color: var(--warning-hover);
  }
}
</style>
