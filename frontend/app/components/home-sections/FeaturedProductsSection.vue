<script setup lang="ts">
import type { FeaturedProduct } from "@/types/types";

interface Props {
  featuredProducts: FeaturedProduct[];
}

const { featuredProducts } = defineProps<Props>();
</script>

<template>
  <section class="featured-products-section">
    <div
      v-for="section in featuredProducts"
      :key="section.id"
      class="featured-products-block"
    >
      <UBackground
        v-if="section.retinaBgImage?.url"
        :retinaSrc="section.retinaBgImage?.url"
        :src="section.fallbackBgImage?.url"
      />
      
      <div class="featured-products-block__content">
        <h2 v-if="section.heading" class="featured-products-block__title">
          {{ section.heading }}
        </h2>
        
        <!-- Сетка продуктов -->
        <div class="featured-products-block__grid">
          <div
            v-for="product in section.products"
            :key="product.id"
            class="featured-products-block__item"
          >
            <div class="product-card">
              <UImage
                v-if="product.image && product.image.length > 0"
                :src="product.image[0]?.url"
                :alt="product.image[0]?.alternativeText || product.name"
                width="200"
                height="200"
                type="cover"
              />
              
              <div class="product-card__info">
                <h3 class="product-card__name">{{ product.name }}</h3>
                
                <div v-if="product.category" class="product-card__category">
                  {{ product.category.name }}
                </div>
                
                <div class="product-card__price">
                  {{ product.price }} руб.
                </div>
                
                <div class="product-card__actions">
                  <UButton label="Подробнее" variant="secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Кнопка "Показать все" -->
        <!-- <div class="featured-products-block__footer">
          <UButton
            :label="section.link || 'Показать все'"
            variant="primary"
            @click="$router.push('/products')"
          />
        </div> -->
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.featured-products-section {
  position: relative;
  padding: 40px 0;
}

.featured-products-block {
  position: relative;
  padding: 20px;
  
  &__content {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  &__title {
    text-align: center;
    margin-bottom: 30px;
    font-size: 2rem;
  }
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  &__item {
    background: var(--bg-card);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: translateY(-5px);
    }
  }
  
  &__footer {
    text-align: center;
  }
}

.product-card {
  &__info {
    padding: 15px;
  }
  
  &__name {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  &__category {
    color: var(--text-muted);
    font-size: 0.9em;
    margin-bottom: 5px;
  }
  
  &__price {
    color: var(--accent-color);
    font-weight: bold;
    font-size: 1.1em;
    margin-bottom: 10px;
  }
  
  &__actions {
    display: flex;
    justify-content: center;
  }
}
</style>
