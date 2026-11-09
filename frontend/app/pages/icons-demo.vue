<script setup lang="ts">
// ВРЕМЕННО: демо-страница вариантов иконок для плашки «в корзину».
// Открыть: http://localhost:3000/icons-demo
const pairs = [
  { name: 'Корзина → отмечено', add: 'mdi:cart-outline', check: 'mdi:check-circle' },
  { name: 'Корзина с плюсом → корзина с галочкой', add: 'mdi:cart-plus', check: 'mdi:cart-check' },
  { name: 'Плетёнка → звезда-печать', add: 'mdi:basket-outline', check: 'mdi:check-decagram' },
  { name: 'Тележка (mingcute) → отмечено (fill)', add: 'mingcute:shopping-cart-2-line', check: 'mingcute:check-circle-fill' },
  { name: 'Корзина-вариант → жирная галочка', add: 'mdi:cart-variant', check: 'mdi:check-bold' },
  { name: 'Корзина со стрелкой → посылка с галочкой', add: 'mdi:cart-arrow-right', check: 'mdi:package-variant-closed-check' },
  { name: 'Сумка (mingcute) → галочка (fill)', add: 'mingcute:shopping-bag-2-line', check: 'mingcute:check-fill' },
  { name: 'Корзина → звезда-печать', add: 'mdi:cart', check: 'mdi:check-decagram' },
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
      <Icon name="mdi:cart-outline" />
      <Icon name="mdi:check-circle" />
      <Icon name="mdi:cart-plus" />
      <Icon name="mdi:cart-check" />
      <Icon name="mdi:basket-outline" />
      <Icon name="mdi:check-decagram" />
      <Icon name="mingcute:shopping-cart-2-line" />
      <Icon name="mingcute:check-circle-fill" />
      <Icon name="mdi:cart-variant" />
      <Icon name="mdi:check-bold" />
      <Icon name="mdi:cart-arrow-right" />
      <Icon name="mdi:package-variant-closed-check" />
      <Icon name="mingcute:shopping-bag-2-line" />
      <Icon name="mingcute:check-fill" />
      <Icon name="mdi:cart" />
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
