<script setup lang="ts">
import { logoTranslations } from "~/locales/logo";

const { currentLocale } = useLocale();
const t = computed(() => logoTranslations[currentLocale.value])
const config = useRuntimeConfig();

interface Props {
  global: GlobalData;
  width?: string | number;
  height?: string | number;
  // "link" — ссылка с фирменным кругом (шапка/футер)
  // "mark" — только знак, без ссылки и фона (декор: разделители и т.п.)
  variant?: "link" | "mark";
  // «Блик» по знаку (только variant="mark")
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  width: 45,
  height: 45,
  variant: "link",
  animated: false,
})

const toCssSize = (value: string | number) =>
  typeof value === "number" ? `${value}px` : value

// Логотип из Strapi; для CSS-маски путь должен быть абсолютным
const logoSrc = computed(() => {
  const url = props.global?.footer?.logo?.url
  if (!url) return "/image/logo.svg"
  return url.startsWith("http") ? url : `${config.public.strapi.url}${url}`
})

const markStyle = computed(() => ({
  "--logo-src": `url("${logoSrc.value}")`,
  "--logo-w": toCssSize(props.width),
  "--logo-h": toCssSize(props.height),
}))
</script>

<template>
  <NuxtLink
    v-if="variant === 'link'"
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

  <!-- Только знак: без ссылки и фона — декоративное использование -->
  <span
    v-else
    class="logo-mark"
    :class="{ 'logo-mark_animated': animated }"
    :style="markStyle"
    aria-hidden="true"
  />
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

// Знак логотипа как CSS-маска: цвет = currentColor, с анимацией — бегущий блик
.logo-mark {
  display: inline-block;
  flex-shrink: 0;
  width: var(--logo-w);
  height: var(--logo-h);
  background-color: currentColor;
  -webkit-mask-image: var(--logo-src);
  mask-image: var(--logo-src);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;

  &_animated {
    background-color: transparent;
    background-image: linear-gradient(
      100deg,
      var(--green-color) 30%,
      var(--light-color) 50%,
      var(--green-color) 70%
    );
    background-size: 300% 100%;
    animation: logo-shine 8s linear infinite;
  }
}

@keyframes logo-shine {
  from {
    background-position: 150% 0;
  }

  to {
    background-position: -150% 0;
  }
}
</style>
