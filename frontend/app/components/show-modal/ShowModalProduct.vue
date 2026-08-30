<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { buttonTranslations } from '~/locales/button'

// USlider загружается лениво: используется только внутри открытой модалки
const USlider = defineAsyncComponent(() => import('~/components/USlider.vue'))

interface SliderApi {
  go: (n: number) => void
  active: Ref<number>
}

const props = withDefaults(
  defineProps<{
    // Может быть null (общий инстанс в Header, пока не выбран товар)
    product?: Product | null
    // Скрыть собственный триггер-кнопку (когда модалка открывается через ref, напр. в корзине)
    hideTrigger?: boolean
  }>(),
  { product: null, hideTrigger: false }
)

const cartStore = useCartStore()
const route = useRoute()
const { isInCart } = useIsInCart()
const { find } = useStrapi()

// Уникальный id диалога для инстанса (useId стабилен между SSR/CSR и уникален
// между инстансами). useDialog захватывает его при setup, поэтому смена продукта
// не ломает open/close. Уникальность обязательна: глобальный dialogElementMap
// ключуется по id, а один и тот же товар может жить в нескольких инстансах
// (карточки чата, Header + OrderHistory на одной странице).
const dialogId = "product-" + useId()

const dialogElement = useTemplateRef<HTMLDialogElement>("product-dialog")
const wrapperRef = useTemplateRef<HTMLDivElement>("wrapper")
const { open, close } = useDialog(
  dialogId,
  dialogElement,
  { useShowMethod: false }
)

// Реактивный ключ: при смене продукта (общий инстанс) детали перезапрашиваются.
// Единый формат со страницами товара (product-${locale}-${slug}) — общий кэш:
// данные страницы переиспользует модалка и наоборот (TTL 5 мин).
const { currentLocale } = useLocale()
const detailsKey = computed(() =>
  "product-" + (currentLocale.value ?? "ru") + "-" + (props.product?.slug ?? "preview")
)

const { data: details, status, execute } = useCachedAsyncData(
  detailsKey,
  async () => {
    if (!props.product?.slug) return null
    const response = await find("products", {
      filters: { slug: { $eq: props.product.slug } },
      populate: {
        image: { fields: ["url", "alternativeText"] },
        mainImage: { fields: ["url", "alternativeText"] },
      },
    } as any)
    return response.data?.[0] as Product
  },
  { immediate: false, server: false, ttl: 300_000 }
)

// Слайды изображений: детали (полные) → fallback на product.image
const galleryImages = computed(() =>
  details.value?.image || props.product?.image || []
)

// Управление слайдером извне (пагинация-миниатюры вынесены отдельным блоком)
const sliderRef = useTemplateRef<SliderApi>("slider")

// Экспонированный `active` из USlider приходит через defineExpose уже развёрнутым
// (в Vue 3.5 exposed-refs авторазворачиваются) — обрабатываем оба случая: число или ref
const sliderActive = computed<number>(() => {
  const active = sliderRef.value?.active
  return typeof active === "number" ? active : (active?.value ?? 1)
})

// Префетч деталей товара при скролле — когда карточка входит в область видимости
let prefetchObserver: IntersectionObserver | null = null

onMounted(() => {
  if (!wrapperRef.value) return
  prefetchObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        execute()
        prefetchObserver?.disconnect()
      }
    },
    { rootMargin: "100px" }
  )
  prefetchObserver.observe(wrapperRef.value)
})

onUnmounted(() => {
  prefetchObserver?.disconnect()
})

const openModal = () => {
  if (!props.product) return   // ничего не выбрано — не открываем
  open?.()
  // Всегда перезапрашиваем: при переиспользовании модалки продукт может смениться
  execute()
}

const parseCharacteristics = (char: string) => {
  try {
    return JSON.parse(char)
  } catch {
    return []
  }
}

defineExpose({ openModal })

const handleAddToCart = () => {
  if (!props.product) return
  const categorySlug = (route.params.categorySlug as string)
    || props.product.subcategory?.category?.slug
    || ''
  if (isInCart(props.product.documentId)) {
    cartStore.removeFromCart(props.product.documentId)
  } else {
    cartStore.addToCart(props.product, categorySlug, props.product.subcategory?.slug || null)
  }
}
</script>

<template>
  <div v-if="!hideTrigger" ref="wrapper" class="product-modal__trigger">
    <UButton
      class="product-modal__trigger-btn"
      icon="mdi:show-outline"
      :aria-label="buttonTranslations[currentLocale].ariaLabelViewProduct"
      @click="openModal"
    />
  </div>

  <!-- Диалог всегда смонтирован: при hide-trigger кнопки нет, но модалка открывается через ref (корзина) -->
  <dialog ref="product-dialog" class="product-modal">
    <!-- Крестик: плавающий, сверху справа, всегда доступен -->
    <button
      type="button"
      class="product-modal__close"
      aria-label="Закрыть"
      @click="close"
    >
      <Icon name="mingcute:close-line" />
    </button>

    <div v-if="status === 'pending'" class="product-modal__skeleton">
      <div class="product-modal__skeleton-gallery" />
      <div class="product-modal__skeleton-text" />
    </div>

    <div v-else-if="status === 'error'" class="product-modal__error">
      <p>{{ status }}</p>
      <UButton variant="close" @click="() => execute()">Повторить</UButton>
    </div>

    <div v-else-if="status === 'success' && details" class="product-modal__body">
      <div class="product-modal__gallery">
        <USlider
          v-if="galleryImages.length"
          ref="slider"
          :slides="galleryImages"
          slide-key="url"
          variant="product"
          :height="'auto'"
          :show-pagination="false"
          :show-navigation="galleryImages.length > 1"
        >
          <template #default="{ slide, index }">
            <UImage
              :src="slide.url"
              :alt="product?.name"
              type="product"
              width="290"
              height="218"
              :loading="index === 0 ? 'eager' : 'lazy'"
            />
          </template>
        </USlider>

        <!-- Пагинация — отдельный блок, вне слайдера -->
        <div v-if="galleryImages.length > 1" class="product-modal__thumbs">
          <button
            v-for="(img, i) in galleryImages"
            :key="img.url"
            type="button"
            class="product-modal__thumb"
            :class="{ 'product-modal__thumb_active': sliderActive === i + 1 }"
            :aria-label="`Изображение ${i + 1}`"
            @click="sliderRef?.go(i + 1)"
          >
              <UImage
                :src="img.url"
                :alt="`${product?.name} - ${i + 1}`"
                type="product"
                width="40"
                height="40"
                class="product-modal__thumb-img"
              />
          </button>
        </div>
      </div>

      <div class="product-modal__info">
        <h2 class="product-modal__title">{{ product?.name }}</h2>
        <p class="product-modal__price">{{ formatPrice(product?.price ?? 0) }}</p>
        <div class="product-modal__desc">
          <LazyMDC :value="details.description" />
        </div>
        <LazyProductCharacteristics
          v-if="details.characteristics"
          :specs="parseCharacteristics(details.characteristics)"
        />
        <UButton
          class="product-modal__add"
          variant="add"
          :is-in-cart="isInCart(product?.documentId ?? '')"
          @click="handleAddToCart"
        />
      </div>
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
.product-modal__trigger {
  grid-area: show;
}

.product-modal__trigger-btn {
  border-radius: 50%;
  color: var(--gray-color);
  background-color: var(--whitesmoke-color);
  cursor: pointer;
}

// Модалка товара — по паттерну проекта (как Order/Checkout):
// нативный <dialog> центрирует сам (top-layer + margin: auto), никаких
// position:fixed / z-index / display — только размеры и анимация входа.
.product-modal {
  width: min(92vw, toRem(920));
  height: min(90vh, toRem(760));
  border-radius: toRem(20);
  background: var(--light-color);
  box-shadow: 0 toRem(24) toRem(80) rgba(0, 0, 0, 0.3);
  overflow: hidden;

  scale: 0.96;
  opacity: 0;
  transition:
    scale var(--transition-duration),
    opacity var(--transition-duration),
    overlay var(--transition-duration) allow-discrete,
    display var(--transition-duration) allow-discrete;

  &[open] {
    scale: 1;
    opacity: 1;
  }

  @starting-style {
    &[open] {
      scale: 0.96;
      opacity: 0;
    }
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition:
      opacity var(--transition-duration),
      overlay var(--transition-duration) allow-discrete,
      display var(--transition-duration) allow-discrete;
  }

  &[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    &[open]::backdrop {
      opacity: 0;
    }
  }

  &__close {
    position: absolute;
    top: toRem(14);
    right: toRem(14);
    // Выше контента: у .slider из USlider z-index: 100 — без этого на мобильной
    // раскладке (галерея сверху) слайдер перекрывал крестик и клик не попадал.
    z-index: 1000;
    display: grid;
    place-items: center;
    width: toRem(40);
    height: toRem(40);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 toRem(2) toRem(10) rgba(0, 0, 0, 0.15);
    color: var(--color);
    cursor: pointer;
    transition: background var(--transition-duration), scale var(--transition-duration);

    svg {
      font-size: toRem(22);
    }

    @include hover {
      background: var(--bg-secondary);
      scale: 1.06;
    }
  }

  &__skeleton {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: toRem(16);
    padding: toRem(20);
  }

  &__skeleton-gallery {
    width: toRem(260);
    height: toRem(200);
    border-radius: toRem(12);
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.4s ease infinite;
  }

  &__skeleton-text {
    width: toRem(180);
    height: toRem(16);
    border-radius: toRem(8);
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.4s ease infinite;
  }

  &__error {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: toRem(12);
    padding: toRem(20);
    color: var(--danger-color);
  }

  &__body {
    display: grid;
    grid-template-columns: 1fr;
    gap: toRem(24);
    height: 100%;
    padding: toRem(28);
    overflow-y: auto;
    align-content: start;

    @media (min-width: toEm(640)) {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }

  &__gallery {
    min-width: 0;
    @include containerParent(productImage, inline-size);

    // Блок главного изображения: фон убран, вместо него — рамка со скруглением.
    // Само изображение уже закруглено UImage (type="product").
    :deep(.slider) {
      background: transparent;
      border: toRem(1) solid var(--border-color);
      border-radius: toRem(6);
      overflow: hidden;
    }
  }

  // Пагинация — отдельный блок вне слайдера, без фона: просто миниатюры
  // с тонкой рамкой и скруглением.
  &__thumbs {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: toRem(8);
    margin-block-start: toRem(14);
  }

  &__thumb {
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(6);
    padding: toRem(2);
    background: none;
    cursor: pointer;
    opacity: 0.65;
    transition: opacity var(--transition-duration), border-color var(--transition-duration);

    &_active {
      opacity: 1;
      border-color: var(--primary-color);
    }

    @include hover {
      opacity: 1;
    }
  }

  &__thumb-img {
    // Квадратные миниатюры (40×40): переопределяем aspect-ratio 4/3 у product-типа
    &.app-image_product {
      width: toRem(40);
      height: toRem(40);
      aspect-ratio: 1 / 1;
    }
    border-radius: toRem(4);
    background-color: var(--bg-product);
    display: block;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: toRem(14);
    min-width: 0;
  }

  &__title {
    margin: 0;
    padding-inline-end: toRem(48);   // не залезает под крестик
    @include adaptiveValue("font-size", 26, 20);
  }

  &__price {
    margin: 0;
    font-weight: 700;
    color: var(--success-color);
    @include adaptiveValue("font-size", 24, 20);
  }

  &__desc {
    color: var(--text-muted);
    line-height: 1.5;
  }

  &__add {
    // Ширина по контенту, выравнивание по концу flex-колонки (правый край)
    align-self: flex-end;
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
