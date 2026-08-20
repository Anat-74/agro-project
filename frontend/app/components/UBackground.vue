<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { effectTranslations } from '~/locales/effects'

// Переключатель фонов — поповер, лениво (настройки, открываются по требованию)
const BackgroundSwitcher = defineAsyncComponent(() => import('./popover/BackgroundPopover.vue'))

// Id поповера генерируется в синхронном родителе: у async-компонентов useId()
// на сервере и клиенте даёт разные значения → popovertarget не совпадёт с id.
// Префикс обязателен: у ColorModePopover и этого попапа useId() совпадает
// (одинаковая позиция в дереве) → дубликаты id ломали popovertarget.
const backgroundPopupId = `bg-popover-${useId()}`

interface Props {
  src?: string;
  retinaSrc?: string;
  variant?: "hero" | "card" | "modal" | "clean" | "feature";
  effect?: "parallax" | "kenburns" | "zoom" | "none";
  loading?: "shimmer" | "pulse" | "wave" | "none";
  gradient?: "rainbow" | "sunset" | "ocean" | "violet" | "none";
  filter?: "brightness" | "contrast" | "saturate" | "darken" | "none";
  hoverEffect?: "zoom" | "darken" | "glow" | "lift" | "none";
  sizeMode?: "cover" | "contain" | "original";
  bgPosition?: string;
  backgroundOptions?: BackgroundItem[];
}

const config = useRuntimeConfig();

const props = withDefaults(defineProps<Props>(), {
  src: '',
  retinaSrc: '',
  variant: "clean",
  effect: "none",
  loading: "none",
  gradient: "none",
  filter: "none",
  hoverEffect: "none",
  sizeMode: "original",
  bgPosition: "center",
  backgroundOptions: () => [],
});

const selectedBg = ref<BackgroundItem | null>(null)
const isHovered = ref(false)

const isDynamic = computed(() => !!(props.backgroundOptions && props.backgroundOptions.length > 0))

// ===== Эффекты фона по тапу =====
const { currentLocale } = useLocale()
const effectT = computed(() => effectTranslations[currentLocale.value])

const BG_EFFECTS = ["press", "zoom", "focus"] as const

const bgEffectIndex = ref(0)
const bgEffectClass = computed(() => `bgfx-${BG_EFFECTS[bgEffectIndex.value]}`)
const effectName = computed(() => effectT.value.effectNames[BG_EFFECTS[bgEffectIndex.value]])

const showEffectHint = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | undefined

const cycleBgEffect = () => {
  showEffectHint.value = false
  bgEffectIndex.value = (bgEffectIndex.value + 1) % BG_EFFECTS.length
  if (isDynamic.value) {
    localStorage.setItem(bgEffectStorageKey.value, String(bgEffectIndex.value))
  }
}

// Клик по фону — перебор эффектов (только для динамического фона)
const handleBgClick = () => {
  if (isDynamic.value) cycleBgEffect()
}

// Одноразовая подсказка при первом визите
onMounted(() => {
  if (!isDynamic.value) return
  if (!localStorage.getItem("bgEffectHintShownV2")) {
    localStorage.setItem("bgEffectHintShownV2", "1")
    showEffectHint.value = true
    hintTimer = setTimeout(() => {
      showEffectHint.value = false
    }, 5000)
  }
})

onUnmounted(() => {
  clearTimeout(hintTimer)
})

// Ключ выбранного фона — по типу страницы: на разных страницах (блог, кабинет,
// корзина…) пользователь может выбрать разные фоны; каждый тип хранится отдельно
const route = useRoute()
const backgroundKey = computed(() => getBackgroundKey(route.path))

const storageKey = computed(() => `selectedBackground:${backgroundKey.value}`)

const loadSelectedBg = () => {
  if (!isDynamic.value || !props.backgroundOptions) return
  const saved = localStorage.getItem(storageKey.value)
  if (saved) {
    const found = props.backgroundOptions.find(bg => String(bg.id) === saved)
    if (found) { selectedBg.value = found; return }
  }
  const defaultBg = props.backgroundOptions.find(bg => bg.isDefault === true)
  selectedBg.value = defaultBg || props.backgroundOptions[0] || null
}

onMounted(loadSelectedBg)

// При переходе на другой тип страницы — подхватываем его сохранённый фон
watch(backgroundKey, loadSelectedBg)

const onSelectBg = (bg: BackgroundItem) => {
  selectedBg.value = bg
  localStorage.setItem(storageKey.value, String(bg.id))
}

// ===== Размер отображения фона (пользовательский выбор) =====
// Хранится по типу страницы (как фон). Приоритет: выбор пользователя > пропс родителя.
const sizeStorageKey = computed(() => `backgroundSize:${backgroundKey.value}`)

const userSizeMode = ref<"cover" | "contain" | "original">(props.sizeMode)

const loadSizeMode = () => {
  if (!isDynamic.value) return
  const saved = localStorage.getItem(sizeStorageKey.value)
  if (saved === "cover" || saved === "contain" || saved === "original") {
    userSizeMode.value = saved
    return
  }
  // Нет выбора пользователя → дефолт от родителя (пропс)
  userSizeMode.value = props.sizeMode
}

onMounted(loadSizeMode)

// При переходе на другой тип страницы — подхватываем его сохранённый размер
watch(backgroundKey, loadSizeMode)

const onSizeChange = (mode: "cover" | "contain" | "original") => {
  userSizeMode.value = mode
  localStorage.setItem(sizeStorageKey.value, mode)
}

// ===== Эффект фона хранится по типу страницы (как фон и размер) =====
const bgEffectStorageKey = computed(() => `bgEffect:${backgroundKey.value}`)

const loadBgEffect = () => {
  if (!isDynamic.value) return
  const saved = Number(localStorage.getItem(bgEffectStorageKey.value))
  if (Number.isInteger(saved) && saved >= 0 && saved < BG_EFFECTS.length) {
    bgEffectIndex.value = saved
  } else {
    bgEffectIndex.value = 0
  }
}

onMounted(loadBgEffect)

// При переходе на другой тип страницы — подхватываем его сохранённый эффект
watch(backgroundKey, loadBgEffect)

const imageUrls = computed(() => {
  let baseImageUrl: string | null = null;
  let retinaImageUrl: string | null = null;
  const strapiUrl = config.public.strapi.url;
  if (isDynamic.value && selectedBg.value) {
    const toFull = (url?: string) => (url && url.startsWith("/") ? `${strapiUrl}${url}` : url || null)
    baseImageUrl = toFull(selectedBg.value.imageWebp?.url)
    retinaImageUrl = toFull(selectedBg.value.imageAvif?.url)
  } else {
    if (props.src) {
      baseImageUrl = props.src.startsWith("http") || props.src.startsWith("//") || props.src.startsWith("/uploads/")
        ? (props.src.startsWith("/uploads/") ? `${config.public.strapi.url}${props.src}` : props.src)
        : (props.src.startsWith("/") ? props.src : `/image/${props.src}`);
    }
    if (props.retinaSrc) {
      retinaImageUrl = props.retinaSrc.startsWith("http") || props.retinaSrc.startsWith("//")
        ? props.retinaSrc
        : `${config.public.strapi.url}${props.retinaSrc}`;
    }
  }
  const removeExtension = (url: string) => url.replace(/\.(avif|webp)$/i, "");
  return {
    baseWebpUrl: baseImageUrl ? `${removeExtension(baseImageUrl)}.webp` : null,
    retinaAvifUrl: retinaImageUrl ? `${removeExtension(retinaImageUrl)}.avif` : null,
  };
});

const backgroundStyle = computed(() => {
  const styles: any = { backgroundPosition: props.bgPosition, backgroundRepeat: "no-repeat" };
  // Приоритет: выбор пользователя > пропс родителя
  const sizeMode = isDynamic.value ? userSizeMode.value : props.sizeMode
  switch (sizeMode) {
    case "cover": styles.backgroundSize = "cover"; break;
    case "contain": styles.backgroundSize = "contain"; break;
    default: styles.backgroundSize = "auto";
  }
  const { baseWebpUrl, retinaAvifUrl } = imageUrls.value;
  if (baseWebpUrl || retinaAvifUrl) {
    const parts = [];
    if (baseWebpUrl) parts.push(`url('${baseWebpUrl}') type('image/webp') 1x`);
    if (retinaAvifUrl) parts.push(`url('${retinaAvifUrl}') type('image/avif') 2x`);
    styles.backgroundImage = `image-set(${parts.join(", ")})`;
  }
  return styles;
});

// Классы для эффектов
const variantClass = computed(() => `variant-${props.variant}`);
const effectClass = computed(() => `effect-${props.effect}`);
const loadingClass = computed(() => `loading-${props.loading}`);
const gradientClass = computed(() =>
  props.gradient !== "none" ? `gradient-${props.gradient}` : "",
);
const filterClass = computed(() =>
  props.filter !== "none" ? `filter-${props.filter}` : "",
);

const interactiveClass = computed(() => ({
  "is-hovered": isHovered.value,
  [`hover-${props.hoverEffect}`]:
    isHovered.value && props.hoverEffect !== "none",
}));
</script>

<template>
  <div
    :class="[
      'app-bg',
      variantClass,
      effectClass,
      loadingClass,
      gradientClass,
      filterClass,
      bgEffectClass,
      { 'bg-interactive': isDynamic },
      interactiveClass,
    ]"
    :style="backgroundStyle"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="handleBgClick"
  >
    <slot />
  </div>
  <!-- Переключатель вне .app-bg: transform/filter фона (is-active) создаёт
       containing block, ломающий position:fixed кнопки внутри .app-bg -->
  <BackgroundSwitcher
    v-if="isDynamic"
    :popup-id="backgroundPopupId"
    :backgrounds="backgroundOptions || []"
    :selected-id="selectedBg?.id"
    :size-mode="userSizeMode"
    @select="onSelectBg"
    @size-change="onSizeChange"
  />

  <!-- Мини-кнопка эффектов фона + одноразовая подсказка при первом визите.
       Клик по свободному месту фона работает аналогично -->
  <div v-if="isDynamic" class="bg-effects">
    <Transition name="bg-hint">
      <span v-if="showEffectHint" class="bg-effects__hint">{{ effectT.hint }}</span>
    </Transition>
    <UTooltip :text="effectName">
      <UButton
        class="bg-effects__trigger"
        variant="palette"
        icon="mingcute:sparkles-line"
        :aria-label="effectT.ariaLabel"
        @click="handleBgClick"
      />
    </UTooltip>
  </div>
</template>

<style lang="scss" scoped>
/* ========== БАЗОВЫЕ СТИЛИ ========== */
.app-bg {
  overflow: hidden;
  position: absolute;
  inset: 0;

  /* ========== АНИМАЦИЯ ПОЯВЛЕНИЯ ========== */
  opacity: 1;
  transition: opacity 1.8s ease;

  // Динамический фон кликабелен (тап — сменить эффект)
  &.bg-interactive {
    cursor: pointer;
  }

  @starting-style {
    opacity: 0;
  }

  /* ========== ВАРИАНТЫ КОМПОНЕНТА ========== */
  /*.variant-clean - Clean (по умолчанию) - только фон */

  &.variant-clean {
   transition: filter .6s ease, transform .5s;
  }

  /* Hero вариант */
  &.variant-hero {
    min-height: 100vh;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 150px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
      z-index: 1;
    }
  }

  /* Card вариант */
  &.variant-card {
    border-radius: inherit;
  }

  /* Modal вариант */
  &.variant-modal {
    border-radius: inherit;
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
  }

  /* Feature вариант */
  &.variant-feature {
    border-radius: inherit;
  }

  /* ========== ЭФФЕКТЫ ФОНА ========== */
  &.effect-parallax {
    background-attachment: fixed;

    @media (prefers-reduced-motion: reduce) {
      background-attachment: scroll;
    }
  }

  &.effect-kenburns {
    animation:
      kenburns 20s ease infinite,
      app-bg-fade-in 0.3s ease;
  }

  &.effect-zoom {
    animation:
      zoom 15s ease infinite,
      app-bg-fade-in 0.3s ease;
  }

  /* ========== ГЛОБАЛЬНЫЕ АНИМАЦИИ ========== */
  @keyframes app-bg-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* ========== ЭФФЕКТЫ ЗАГРУЗКИ ========== */
  &.loading-shimmer::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent
    );
    animation: shimmer 3.8s infinite;
    z-index: 1;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
      display: none;
    }
  }

  &.loading-pulse {
    animation:
      pulse 2.5s ease-in-out infinite,
      app-bg-fade-in 0.3s ease;
  }

  &.loading-wave {
    mask: linear-gradient(90deg, #000 25%, #000 50%, #fff 75%);
    mask-size: 200% 100%;
    animation:
      wave 2s infinite linear,
      app-bg-fade-in 0.3s ease;
  }

  /* ========== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ ========== */
@media (prefers-reduced-motion: no-preference) {
  &.effect-kenburns,
  &.effect-zoom,
  &.bgfx-zoom,
  &.loading-shimmer,
  &.loading-pulse,
  &.loading-wave {
    will-change: transform, opacity;
  }
}

  /* ========== HOVER ЭФФЕКТЫ ========== */
  &.hover-zoom.is-hovered {
    transform: scale(1.03);
  }

  &.hover-darken.is-hovered {
    filter: brightness(0.85);
  }

  &.hover-glow.is-hovered {
    box-shadow:
      0 0 40px rgba(255, 255, 255, 0.3),
      0 20px 60px rgba(0, 0, 0, 0.2);
  }

  &.hover-lift.is-hovered {
    transform: translateY(-8px);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2);
  }

  /* ========== ЭФФЕКТЫ ПО ТАПУ (чип «✦ Эффект») ========== */
  &.bgfx-press {
    filter: brightness(0.7);
    transform: scale(0.95);
  }

  &.bgfx-zoom {
    animation:
      zoom 15s ease infinite,
      app-bg-fade-in 0.3s ease;
  }

  &.bgfx-focus {
    filter: blur(toRem(8));
  }

  /* ========== ГРАДИЕНТНЫЕ ОВЕРЛЕИ ========== */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
  }

  &.gradient-rainbow::after {
    background: linear-gradient(
      45deg,
      rgba(255, 0, 0, 0.05) 0%,
      rgba(255, 153, 0, 0.05) 20%,
      rgba(255, 255, 0, 0.05) 40%,
      rgba(0, 255, 0, 0.05) 60%,
      rgba(0, 153, 255, 0.05) 80%,
      rgba(102, 0, 255, 0.05) 100%
    );
    mix-blend-mode: overlay;
  }

  &.gradient-sunset::after {
    background: linear-gradient(
      135deg,
      rgba(255, 126, 95, 0.1) 0%,
      rgba(254, 180, 123, 0.1) 100%
    );
    mix-blend-mode: multiply;
  }

  &.gradient-ocean::after {
    background: linear-gradient(
      135deg,
      rgba(54, 209, 220, 0.1) 0%,
      rgba(91, 134, 229, 0.1) 100%
    );
    mix-blend-mode: screen;
  }

  &.gradient-violet::after {
    background: linear-gradient(
      135deg,
      rgba(138, 43, 226, 0.1) 0%,
      rgba(186, 85, 211, 0.1) 100%
    );
    mix-blend-mode: overlay;
  }

  /* ========== ФИЛЬТРЫ ========== */
  &.filter-brightness {
    filter: brightness(0.9);
  }

  &.filter-contrast {
    filter: contrast(1.1);
  }

  &.filter-saturate {
    filter: saturate(1.2);
  }

  &.filter-darken {
    filter: brightness(0.8) contrast(1.1);
  }
}

/* ========== АНИМАЦИИ ========== */

@keyframes kenburns {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes zoom {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shimmer {
  100% {
    left: 100%;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.95;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes wave {
  100% {
    mask-position: -200% 0;
  }
}

/* ========== ГЛОБАЛЬНЫЕ СТИЛИ ДЛЯ КОНТЕНТА ========== */
/* .app-bg absolute рисуется поверх статичного контента → поднимаем соседей
   после него (~). Обёртке переключателя z-index задан в BackgroundPopover
   (выше контента), т.к. его fixed-кнопка должна быть поверх страницы */
.app-bg ~ *,
.app-bg > :slotted(*) {
  position: relative;
  z-index: 1;
}

/* ========== МИНИ-КНОПКА И ПОДСКАЗКА ЭФФЕКТОВ ФОНА ========== */
/* Кнопка-иконка над палитрой (стиль палитры, без текста): переключение
   эффектов фона. Фон перекрыт контентом, поэтому явная кнопка — гарантированная
   цель для тапа (в т.ч. на мобильном). */
.bg-effects {
  position: fixed;
  inset-block-end: toRem(66);
  inset-inline-end: toRem(24);
  z-index: 900;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: toRem(8);
  pointer-events: none;

  // UTooltip-обёртка — кликабельна (контейнер pointer-events: none)
  :deep(.tooltip-trigger) {
    pointer-events: auto;
  }

  .bg-effects__trigger {
    svg {
      color: var(--warning-hover);
    }
  }

  .bg-effects__hint {
    font-family: "Neucha", cursive, sans-serif;
    font-size: toEm(12);
    color: var(--primary-color);
    background-color: var(--transparent-color);
    backdrop-filter: blur(toRem(42));
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(8);
    padding-block: toRem(6);
    padding-inline: toRem(10);
    box-shadow: 0 toRem(4) toRem(16) rgba(0, 0, 0, 0.2);
  }
}

.bg-hint-enter-active,
.bg-hint-leave-active {
  transition: opacity 0.3s;
}
.bg-hint-enter-from,
.bg-hint-leave-to {
  opacity: 0;
}
</style>
