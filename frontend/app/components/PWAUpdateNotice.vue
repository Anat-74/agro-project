<script setup lang="ts">
const { $pwa } = useNuxtApp();
</script>

<template>
  <div v-if="$pwa?.needRefresh" class="pwa-update-notice">
    <span>Доступно новое обновление. Нажмите кнопку для обновления.</span>
    <button @click="$pwa?.updateServiceWorker?.(true)">Обновить</button>
    <button @click="$pwa?.cancelPrompt?.()">Отмена</button>
  </div>
</template>

<style lang="scss" scoped>
.pwa-update-notice {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: #4299e1;
  color: white;
  border-radius: 50px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;

  button {
    padding: 8px 16px;
    background: white;
    color: #4299e1;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 600;

    &:hover {
      background: #f0f0f0;
    }
  }
}
</style>
