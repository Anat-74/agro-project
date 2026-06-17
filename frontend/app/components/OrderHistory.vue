<script setup lang="ts">
const { currentLocale } = useLocale()
const { find } = useStrapi()
const authStore = useAuthStore()

const { data: orders, pending } = useAsyncData(
  `orders-user-${authStore.user?.email}`,
  async () => {
    if (!authStore.user?.email) return []

    const response = await find('orders', {
      filters: { email: { $eq: authStore.user.email } } as any,
      sort: ['createdAt:desc'],
      pagination: { page: 1, pageSize: 50 },
    })

    return (response.data as any[]) || []
  },
  {
    server: false,
    lazy: true,
    watch: [() => authStore.user?.email],
  },
)
</script>

<template>
  <ClientOnly>
    <div class="order-history">
      <p v-if="pending" class="order-history__loading">Загрузка...</p>

      <p v-else-if="!orders?.length" class="order-history__empty">
        У вас пока нет заказов
      </p>

      <ul v-else class="order-history__list">
        <li
          v-for="order in orders"
          :key="order.documentId || order.id"
          class="order-history__item"
        >
          <div class="order-history__item-info">
            <p class="order-history__item-id">
              Заказ #{{ order.documentId || order.id }}
            </p>
            <p class="order-history__item-date">
              {{ new Date(order.createdAt).toLocaleDateString() }}
            </p>
            <p class="order-history__item-status">
              {{ order.statusOrders || 'Новый' }}
            </p>
          </div>
          <div class="order-history__item-total">
            {{ order.total }} ₽
          </div>
          <NuxtLink
            :to="`/${currentLocale}/cabinet/${order.documentId || order.id}`"
            class="order-history__item-link"
          >
            Просмотр
          </NuxtLink>
        </li>
      </ul>
    </div>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.order-history {
  &__loading,
  &__empty {
    text-align: center;
    padding-block: toRem(40);
    color: var(--text-muted);
  }

  &__list {
    display: grid;
    gap: toRem(12);
  }

  &__item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: toRem(16);
    align-items: center;
    padding: toRem(16);
    background: var(--bg-secondary);
    border-radius: toRem(10);
    transition: background var(--transition-duration);

    @include hover {
      background: var(--bg-hover);
    }
  }

  &__item-info {
    display: grid;
    gap: toRem(4);
  }

  &__item-id {
    font-weight: 600;
  }

  &__item-date {
    font-size: toRem(13);
    color: var(--text-muted);
  }

  &__item-status {
    font-size: toRem(13);
    color: var(--primary-color);
  }

  &__item-total {
    font-weight: 700;
    @include adaptiveValue("font-size", 18, 16);
    white-space: nowrap;
  }

  &__item-link {
    color: var(--primary-color);
    text-decoration: underline;
    font-size: toRem(14);
    white-space: nowrap;

    @include hover {
      color: var(--primary-hover);
    }
  }
}
</style>
