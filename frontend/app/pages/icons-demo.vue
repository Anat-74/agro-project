<script setup lang="ts">
// ВРЕМЕННО: демо-страница вариантов иконок для плашки «в корзину».
// Открыть: http://localhost:3000/icons-demo
const pairs = [
  { name: "mingcute:add-line / mingcute:check-line", add: "mingcute:add-line", check: "mingcute:check-line" },
  { name: "mingcute:plus-line / mingcute:check-circle-line", add: "mingcute:plus-line", check: "mingcute:check-circle-line" },
  { name: "mingcute:add-circle-line / mingcute:check-fill", add: "mingcute:add-circle-line", check: "mingcute:check-fill" },
  { name: "mingcute:add-fill / mingcute:check-line", add: "mingcute:add-fill", check: "mingcute:check-line" },
  { name: "mingcute:add-line / mingcute:check-fill", add: "mingcute:add-line", check: "mingcute:check-fill" },
  { name: "mdi:plus / mdi:check-bold", add: "mdi:plus", check: "mdi:check-bold" },
  { name: "mdi:cart-plus / mdi:check", add: "mdi:cart-plus", check: "mdi:check" },
  { name: "mdi:plus-thick / mdi:check-decagram", add: "mdi:plus-thick", check: "mdi:check-decagram" },
]
</script>

<template>
  <section class="icons-demo">
    <h1 class="icons-demo__title">Иконки плашки «в корзину»: до / после клика</h1>
    <p class="icons-demo__hint">
      Слева — состояние «+» (не в корзине), справа — «в корзине».
    </p>
    <ul class="icons-demo__list">
      <li v-for="(pair, i) in pairs" :key="i" class="icons-demo__item">
        <span class="icons-demo__label">{{ i + 1 }}. {{ pair.name }}</span>
        <div class="icons-demo__plates">
          <UButton
            class="icons-demo__plate"
            variant="add-plate"
            :icon="pair.add"
            :aria-label="pair.name + ' — добавить'"
          />
          <UButton
            class="icons-demo__plate"
            variant="add-plate"
            :icon="pair.check"
            :is-in-cart="true"
            :aria-label="pair.name + ' — в корзине'"
          />
        </div>
      </li>
    </ul>

    <!-- Статический список имён: сканер @nuxt/icon включает их в клиентский бандл
         (динамические :icon не сканируются, иначе на клиенте иконки пропадут) -->
    <div class="icons-demo__preload" aria-hidden="true">
      <Icon name="mingcute:add-line" />
      <Icon name="mingcute:check-line" />
      <Icon name="mingcute:plus-line" />
      <Icon name="mingcute:check-circle-line" />
      <Icon name="mingcute:add-circle-line" />
      <Icon name="mingcute:check-fill" />
      <Icon name="mingcute:add-fill" />
      <Icon name="mdi:plus" />
      <Icon name="mdi:check-bold" />
      <Icon name="mdi:cart-plus" />
      <Icon name="mdi:check" />
      <Icon name="mdi:plus-thick" />
      <Icon name="mdi:check-decagram" />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.icons-demo {
  padding: toRem(24);

  &__title {
    font-size: toRem(20);
    margin-block-end: toRem(8);
  }

  &__hint {
    margin-block-end: toRem(20);
    color: var(--gray-color);
  }

  &__list {
    display: grid;
    gap: toRem(16);
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: toRem(16);
    padding-block-end: toRem(12);
    border-block-end: 1px solid var(--border-color);
  }

  &__label {
    font-size: toRem(14);
  }

  &__plates {
    display: flex;
    gap: toRem(12);
  }

  &__plate {
    --notch-size: 44px;
    --notch-gap: 5px;
    --notch-r: 5px;
  }

  &__preload {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }
}
</style>
