<script setup lang="ts">
import USlider from '~/components/USlider.vue'

const props = defineProps<{
  product: Product
}>()

const config = useRuntimeConfig()

const strapiUrl = (url: string) => `${config.public.strapi.url}${url}`

// Слайды = изображения продукта (из Strapi)
const slides = computed(() => props.product?.image || [])

// Управление слайдером извне: пагинация-миниатюры вынесены отдельным блоком слева
const sliderRef = useTemplateRef<InstanceType<typeof USlider>>("slider")

const sliderActive = computed<number>(() => {
  const active = (sliderRef.value as any)?.active
  return typeof active === "number" ? active : (active?.value ?? 1)
})
</script>

<template>
  <div class="product-gallery">
    <USlider
      v-if="slides.length"
      ref="slider"
      :slides="slides"
      slide-key="url"
      variant="product"
      :height="'auto'"
      :show-pagination="false"
      :show-navigation="slides.length > 1"
    >
      <!-- Слайд: полное изображение, первый eager, остальные lazy -->
      <template #default="{ slide, index }">
        <UImage
          :src="strapiUrl(slide.url)"
          :alt="product.name"
          type="product"
          width="290"
          height="218"
          :loading="index === 0 ? 'eager' : 'lazy'"
        />
      </template>
    </USlider>

    <!-- Пагинация — отдельный блок слева, вне слайдера, без фона -->
    <div v-if="slides.length > 1" class="product-gallery__thumbs">
      <button
        v-for="(img, i) in slides"
        :key="img.url"
        type="button"
        class="product-gallery__thumb"
        :class="{ 'product-gallery__thumb_active': sliderActive === i + 1 }"
        :aria-label="`Изображение ${i + 1}`"
        @click="sliderRef?.go(i + 1)"
      >
        <UImage
          :src="strapiUrl(img.url)"
          :alt="`${product.name} - ${i + 1}`"
          type="product"
          width="40"
          height="40"
          class="product-gallery__thumb-img"
        />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Единая галерея товара для обеих динамических страниц продукта:
// миниатюры слева отдельным блоком (как в модалке), слайдер без фона.
.product-gallery {
  display: flex;
  flex-direction: row;
  align-items: center;   // миниатюры по центру по вертикали (не прижаты к верху)
  gap: toRem(16);
  // Контейнер `product`: на него опираются @container product в UImage.vue,
  // чтобы изображения слайдов адаптировались от ширины галереи.
  @include containerParent(product, inline-size);

  // Блок главного изображения: фон убран, вместо него — рамка со скруглением
  // (само изображение закруглено UImage).
  :deep(.slider) {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(6);
    overflow: hidden;
  }

  // Пагинация — отдельная колонка слева, без фона
  &__thumbs {
    display: flex;
    flex-direction: column;
    gap: toRem(8);
    order: -1;
  }

  &__thumb {
    border: toRem(1) solid var(--border-color);
    border-radius: toRem(6);
    padding: toRem(2);
    background: none;
    color: inherit;
    font: inherit;
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
}
</style>
