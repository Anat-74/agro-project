<script setup lang="ts">
const searchStore = useSearchStore()
const { products, totalPages, currentPage, hasSearched } = storeToRefs(searchStore)
</script>

<template>
  <Teleport to="body">
    <div v-if="hasSearched" class="search-overlay" @click.self="searchStore.resetFilters()">
      <div class="search-overlay__panel">
        <div class="search-overlay__query">
          <Icon name="ph:magnifying-glass-light" />
          <span>{{ searchStore.filters.name }}</span>
        </div>

        <div v-if="products.length" class="search-overlay__results">
          <ul class="search-overlay__list">
            <li v-for="product in products" :key="product.documentId">
              <ProductFilterCard :product="product" />
            </li>
          </ul>

          <div v-if="totalPages > 1" class="search-overlay__pagination">
            <UButton
              v-for="page in totalPages"
              :key="page"
              variant="pagination"
              :label="page"
              :class="{ 'pagination-active': currentPage === page }"
              @click="searchStore.changePage(page)"
            />
          </div>
        </div>

        <div v-else class="search-overlay__empty">
          Ничего не найдено
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.3);

  &__panel {
    width: min(90vw, toRem(600));
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    background: var(--secondary-color);
    border-radius: toRem(12);
    padding: toRem(20);
    box-shadow: 0 toRem(8) toRem(32) rgba(0, 0, 0, 0.15);
  }

  &__query {
    display: flex;
    align-items: center;
    gap: toRem(8);
    padding-block-end: toRem(16);
    margin-block-end: toRem(16);
    border-bottom: toRem(1) solid var(--border-color);
    font-size: toEm(20);
    font-weight: 600;
    color: var(--color);
  }

  &__results {
    overflow-y: auto;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: toRem(8);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    gap: toRem(8);
    padding-block-start: toRem(16);
    margin-block-start: toRem(16);
    border-top: toRem(1) solid var(--border-color);
  }

  &__empty {
    text-align: center;
    padding: toRem(32);
    color: var(--gray-color);
    font-size: toEm(16);
  }
}

.pagination-active {
  background-color: var(--active-color);
}
</style>
