<script setup lang="ts">
const { currentLocale } = useLocale()
const { find } = useStrapi()
const authStore = useAuthStore()

const ordersKey = computed(() => `orders-user-${authStore.user?.email}`)

const { data: orders, status } = useAsyncData(
  ordersKey,
  async () => {
    if (!authStore.user?.email) {
      console.debug('OrderHistory: no user email', authStore.user)
      return []
    }
    console.debug('OrderHistory: fetching orders for', authStore.user.email)

    const ordersResponse = await find('orders', {
      filters: { email: { $eq: authStore.user.email } } as any,
      sort: ['createdAt:desc'],
      pagination: { page: 1, pageSize: 50 },
    })
    console.debug('orders response:', ordersResponse)
    return ordersResponse
  },
  {
    server: false,
    lazy: true,
    watch: [() => authStore.user?.email],
    transform: (response: any) => (response?.data as any[]) || [],
  },
)

const statusLabel: Record<string, string> = {
  new: 'Новый',
  processed: 'В обработке',
  confirmed: 'Подтверждён',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}
</script>

<template>
  <ClientOnly>
    <div class="order-history">
      <OrderHistorySkeleton v-if="status === 'pending'" />

      <p v-else-if="status === 'error'" class="order-history__empty">
        Ошибка загрузки заказов
      </p>

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
            <span
              class="order-history__badge"
              :class="`order-history__badge_${order.statusOrders || 'new'}`"
            >
              {{ statusLabel[order.statusOrders] || 'Новый' }}
            </span>
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
    gap: toRem(6);
  }

  &__item-id {
    font-weight: 600;
  }

  &__item-date {
    font-size: toRem(13);
    color: var(--text-muted);
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

  &__badge {
    display: inline-block;
    font-size: toRem(12);
    font-weight: 600;
    padding: toRem(2) toRem(10);
    border-radius: toRem(20);
    width: fit-content;

    &_new { color: #2e7d32; background: #e8f5e9; }
    &_processed { color: #f57f17; background: #fff8e1; }
    &_confirmed { color: #1565c0; background: #e3f2fd; }
    &_delivered { color: #2e7d32; background: #e8f5e9; }
    &_cancelled { color: #c62828; background: #ffebee; }
  }
}
</style>
