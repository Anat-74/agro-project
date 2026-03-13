<script setup lang="ts">
const { isOnline } = useOnlineStatus();
const refresh = () => window.location.reload();
</script>

<template>
  <div v-if="!isOnline" class="offline-page">
    <div class="offline-page__content">
      <h1 class="offline-page__title">Нет интернета</h1>
      <p class="offline-page__text">
        Проверьте подключение к интернету и попробуйте снова.
      </p>
      <button @click="refresh" class="offline-page__button">Повторить</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.offline-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--light-color);
  padding: 20px;

  &__content {
    text-align: center;
    max-width: 500px;
  }

  &__title {
    font-size: toEm(32);
    margin-bottom: toEm(16);
    color: var(--danger-color);
  }

  &__text {
    font-size: toEm(16);
    margin-bottom: toEm(24);
    color: var(--gray-color);
  }

  &__button {
    padding: toEm(12) toEm(24);
    background: var(--success-color);
    color: white;
    border: none;
    border-radius: toEm(4);
    font-size: toEm(16);
    cursor: pointer;
    transition: background-color var(--transition-duration);

    &:hover {
      background: var(--success-hover);
    }
  }
}
</style>
