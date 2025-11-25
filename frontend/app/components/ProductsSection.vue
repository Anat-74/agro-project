<template>
  <section class="products-section">
    <div class="products-section__container">
      <!-- Заголовок "Categories" -->
      <header class="products-section__header">
        <h2 class="products-section__categories">Categories</h2>
        <h3 class="products-section__products">Our Products</h3>
      </header>

      <!-- Контентная область -->
      <div class="products-section__content">
        <div class="products-section__filters">
          <!-- Фильтры будут добавлены позже -->
        </div>

        <!-- Сетка карточек продуктов -->
        <div class="products-section__products-grid">
          <!-- Карточки продуктов будут добавлены позже -->
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Компонент ProductsSection
// Базовая структура секции с заголовками и сеткой для карточек продуктов
</script>

<style lang="scss" scoped>
.products-section {
  padding: 80px 0;
  width: 100%;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  &__header {
    text-align: center;
    margin-bottom: 60px;
  }

  &__categories {
    color: var(--color);
    margin-bottom: 10px;
  }

  &__products {
    color: var(--color);
    margin: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  &__filters {
    // Стили для фильтров будут добавлены позже
  }

  &__products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 30px;
    width: 100%;
  }
}
</style>