<script setup lang="ts">
interface Props {
  featuredProducts: FeaturedProduct[];
}

const { featuredProducts } = defineProps<Props>();

const MAX_PRODUCTS_TO_SHOW = 6;
</script>

<template>
  <section class="featured-products" aria-labelledby="featured-products">
    <div
      v-for="section in featuredProducts"
      :key="section.id"
      class="featured-products__container"
    >
      <UBackground
        v-if="
          section.backgroundImage?.retinaBgImageAvif?.url ||
          section.backgroundImage?.baseBgImageWebp?.url
        "
        :retinaSrc="section.backgroundImage?.retinaBgImageAvif?.url"
        :src="section.backgroundImage?.baseBgImageWebp?.url"
        bg-position="bottom left"
      />
      <div class="featured-products__content-top">
        <h2
          v-if="section.heading"
          class="featured-products__title"
          id="featured-products"
        >
          {{ section.heading }}
        </h2>
        <NuxtLink v-if="section.link" class="featured-products__link">
          {{ section.link }}
        </NuxtLink>
      </div>
      <ul class="featured-products__list">
        <li
          v-for="product in section.products.slice(0, MAX_PRODUCTS_TO_SHOW)"
          :key="product.id"
          class="featured-products__item"
        >
          <div class="product-card">
            <UImage
              v-if="product.image && product.image.length > 0"
              :src="product.image[0]?.url"
              :alt="product.image[0]?.alternativeText || product.name"
              width="200"
              height="200"
            />

            <div class="product-card__info">
              <h3 class="product-card__name">{{ product.name }}</h3>
              <div v-if="product.price" class="product-card__price">
                {{ product.price }} руб.
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.featured-products {
   padding-block-start: toEm(94);
}
</style>
