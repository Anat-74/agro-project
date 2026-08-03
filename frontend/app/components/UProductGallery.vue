<script setup lang="ts">
const props = defineProps<{
  product: Product
}>()

const config = useRuntimeConfig()

// Активное изображение (главное + переключение по миниатюрам)
const currentImage = ref('')

const isActive = (imgUrl: string) =>
  currentImage.value === `${config.public.strapi.url}${imgUrl}`

const setCurrentImage = (imgUrl: string) => {
  currentImage.value = `${config.public.strapi.url}${imgUrl}`
}

watch(
  () => props.product,
  (product) => {
    if (product?.image?.[0]?.url) {
      currentImage.value = `${config.public.strapi.url}${product.image[0].url}`
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="product-gallery">
    <UImage
      v-if="currentImage"
      :src="currentImage"
      :alt="product.name"
      type="product"
      width="290"
      height="218"
      class="product-gallery__main"
    />

    <ul v-if="product.image?.length" class="product-gallery__thumbnails">
      <li
        v-for="(img, index) in product.image"
        :key="img.documentId || img.id"
        :class="[
          'product-gallery__thumbnail',
          { 'product-gallery__thumbnail_active': isActive(img.url) },
        ]"
        @mouseover="setCurrentImage(img.url)"
        @click="setCurrentImage(img.url)"
      >
        <UImage
          :src="`${config.public.strapi.url}${img.url}`"
          :alt="`${product.name} - Image ${index + 1}`"
          type="product"
          width="80"
          height="60"
          class="product-gallery__thumb-img"
        />
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
// Единая галерея товара для обеих динамических страниц продукта
// (через категорию и через подкатегорию) — одинаковые размеры и container queries.
.product-gallery {
  display: flex;
  flex-direction: column;
  row-gap: toEm(16);
  // Контейнер `product`: на него опираются @container product в UImage.vue,
  // поэтому главное изображение адаптируется (200 → 220 → 260 → 290px)
  // от ширины галереи.
  @include containerParent(product, inline-size);

  &__main {
    align-self: center;
    border-radius: toEm(8);
    box-shadow: 0 0 toRem(4) var(--shadow);
    background-color: var(--bg-product);
    margin-block-end: toEm(18);

    @media (max-width: $tablet) {
      margin-block-end: 0;
    }
  }

  &__thumbnails {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: toEm(10);
    // Контейнер `product-thumb` — компактные миниатюры (до 80px),
    // на него опирается @container product-thumb в UImage.vue.
    @include containerParent(product-thumb, inline-size);

    @media (max-width: $tablet) {
      margin-block-end: toEm(22);
    }
  }

  &__thumbnail {
    cursor: pointer;
    border: toRem(2) solid transparent;
    border-radius: toRem(4);
    box-shadow: 0px 1px toRem(5) var(--shadow);
    transition: all var(--transition-duration);

    &_active {
      border-color: var(--blue-color);
    }

    @include hover {
      scale: 0.9;
    }
  }

  &__thumb-img {
    border-radius: toRem(4);
    background-color: var(--bg-product);
    transition: opacity var(--transition-duration);
  }
}
</style>
