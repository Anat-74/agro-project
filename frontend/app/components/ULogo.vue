<script setup lang="ts">
import { logoTranslations } from "~/locales/logo";

const { currentLocale } = useLocale();
const t = computed(() => logoTranslations[currentLocale.value])

interface Props {
  global: GlobalData;
  width?: string | number;
  height?: string | number;
}

const { width = 45, height = 45, ...props } = defineProps<Props>()
</script>

<template>
  <NuxtLink
    class="logo-link"
    :to="`/${currentLocale}`"
    :aria-label="t.label"
  >
    <UImage
      v-if="props.global?.footer?.logo?.url"
      class="logo-link__image"
      :src="props.global?.footer?.logo?.url"
      :smooth-load="false"
      :width="width"
      :height="height"
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
