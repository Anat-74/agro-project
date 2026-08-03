<script setup lang="ts">
import AppSlider from '~/components/AppSlider.vue'

const props = defineProps<{
  product: Product
}>()

const config = useRuntimeConfig()

const strapiUrl = (url: string) => `${config.public.strapi.url}${url}`

// Слайды = изображения продукта (из Strapi)
const slides = computed(() => props.product?.image || [])
</script>

<template>
  <div class="product-gallery">
    <AppSlider
      v-if="slides.length"
      :slides="slides"
      slide-key="url"
      variant="product"
      :height="'auto'"
      :show-pagination="slides.length > 1"
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

      <!-- Пагинация: миниатюры (клик → слайдер листает) -->
      <template #pagination="{ go, active, slides: thumbs }">
        <button
          v-for="(img, i) in thumbs"
          :key="img.url"
          type="button"
          class="product-gallery__thumb"
          :class="{ 'product-gallery__thumb_active': active === i + 1 }"
          @click="go(i + 1)"
          :aria-label="`Изображение ${i + 1}`"
        >
          <UImage
            :src="strapiUrl(img.url)"
            :alt="`${product.name} - ${i + 1}`"
            type="product"
            width="80"
            height="60"
            class="product-gallery__thumb-img"
          />
        </button>
      </template>
    </AppSlider>
  </div>
</template>

<style lang="scss" scoped>
// Единая галерея товара для обеих динамических страниц продукта
// (через категорию и через подкатегорию) — одинаковые размеры и container queries.
.product-gallery {
  // Контейнер `product`: на него опираются @container product в UImage.vue,
  // чтобы изображения слайдов адаптировались от ширины галереи.
  @include containerParent(product, inline-size);

  &__thumb {
    border: toRem(2) solid transparent;
    border-radius: toRem(4);
    padding: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    opacity: 0.65;
    transition: opacity var(--transition-duration), border-color var(--transition-duration);

    &_active {
      opacity: 1;
      border-color: var(--blue-color);
    }

    @include hover {
      opacity: 1;
    }
  }

  &__thumb-img {
    border-radius: toRem(4);
    background-color: var(--bg-product);
  }
}
</style>
