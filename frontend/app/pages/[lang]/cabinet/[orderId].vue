<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { currentLocale } = useLocale()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.orderId as string)

const { findOne } = useStrapi()
const { data: order, pending } = useAsyncData(
  `order-${orderId.value}`,
  async () => {
    const response = await findOne('orders', orderId.value)
    return response.data as any
  },
  {
    server: false,
    lazy: true,
  },
)

const goBack = () => {
  router.push(`/${currentLocale.value}/cabinet`)
}
</script>

<template>
  <div class="order-detail">
    <UButton
      variant="secondary"
      :is-disabled="false"
      class="order-detail__back"
      @click="goBack"
    >
      ← Назад к заказам
    </UButton>

    <h1 class="order-detail__title">Заказ #{{ orderId }}</h1>

    <p v-if="pending" class="order-detail__loading">Загрузка...</p>

    <div v-else-if="!order" class="order-detail__loading">
      Заказ не найден
    </div>

    <div v-else class="order-detail__card">
      <div class="order-detail__meta">
        <p><strong>Статус:</strong> {{ order.statusOrders || 'Новый' }}</p>
        <p><strong>Дата:</strong> {{ new Date(order.createdAt).toLocaleDateString() }}</p>
        <p><strong>Email:</strong> {{ order.email }}</p>
        <p><strong>Телефон:</strong> {{ order.phone }}</p>
      </div>

      <h2 class="order-detail__section-title">Товары</h2>
      <ul class="order-detail__items">
        <li
          v-for="(item, idx) in order.items"
          :key="idx"
          class="order-detail__item"
        >
          <span class="order-detail__item-name">{{ item.name }}</span>
          <span class="order-detail__item-qty">{{ item.quantity }} шт.</span>
          <span class="order-detail__item-price">{{ item.price }} ₽</span>
        </li>
      </ul>

      <p class="order-detail__total">
        <strong>Итого:</strong> {{ order.total }} ₽
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order-detail {
  max-width: toRem(720);
  margin-inline: auto;
  padding-block: toRem(40);
  padding-inline: toRem(16);

  &__back {
    margin-block-end: toRem(24);
  }

  &__title {
    @include adaptiveValue("font-size", 26, 20);
    font-weight: 700;
    margin-block-end: toRem(24);
  }

  &__loading {
    text-align: center;
    padding-block: toRem(40);
    color: var(--text-muted);
  }

  &__card {
    background: var(--bg-secondary);
    border-radius: toRem(12);
    padding: toRem(24);
  }

  &__meta {
    display: grid;
    gap: toRem(8);
    margin-block-end: toRem(24);
  }

  &__section-title {
    font-weight: 600;
    margin-block-end: toRem(12);
  }

  &__items {
    display: grid;
    gap: toRem(8);
  }

  &__item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: toRem(12);
    padding: toRem(8) 0;
    border-block-end: 1px solid var(--border-color);

    &:last-child {
      border-block-end: none;
    }
  }

  &__item-name {
    font-weight: 500;
  }

  &__item-qty {
    color: var(--text-muted);
  }

  &__item-price {
    font-weight: 600;
    min-width: toRem(80);
    text-align: end;
  }

  &__total {
    margin-block-start: toRem(20);
    text-align: end;
    @include adaptiveValue("font-size", 20, 18);
  }
}
</style>
