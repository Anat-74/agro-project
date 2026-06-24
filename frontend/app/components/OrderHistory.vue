<script setup lang="ts">
const { currentLocale } = useLocale()
const { find, update: strapiUpdate } = useStrapi()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const cancellingId = ref<string | null>(null)

const cancelOrder = async (order: any) => {
  const id = order.documentId || order.id
  cancellingId.value = id
  try {
    await strapiUpdate('orders', id, { statusOrders: 'cancelled' } as any)
    if (orders.value) {
      const idx = orders.value.findIndex((o: any) => (o.documentId || o.id) === id)
      if (idx !== -1) orders.value[idx].statusOrders = 'cancelled'
    }
  } catch (e: any) {
    console.error('Cancel order full error:', e)
    const errText = JSON.stringify(e, Object.getOwnPropertyNames(e))
    alert('Ошибка отмены:\n' + errText.slice(0, 500))
  } finally {
    cancellingId.value = null
  }
}

const canCancel = (order: any) =>
  order.statusOrders === 'new' || order.statusOrders === 'processed'

const statusFilter = ref<string | null>(null)
const currentPage = ref(1)
const totalPages = ref(1)

watch(statusFilter, () => { currentPage.value = 1 })

const ordersKey = computed(() =>
  `orders-user-${authStore.user?.email}-${statusFilter.value || 'all'}-p${currentPage.value}`
)

const { data: orders, status } = useAsyncData(
  ordersKey,
  async () => {
    if (!authStore.user?.email) {
      console.debug('OrderHistory: no user email', authStore.user)
      return []
    }
    console.debug('OrderHistory: fetching orders for', authStore.user.email, 'page', currentPage.value)

    const filters: Record<string, any> = { email: { $eq: authStore.user.email } }
    if (statusFilter.value) {
      filters.statusOrders = { $eq: statusFilter.value }
    }

    const ordersResponse = await find('orders', {
      filters: filters as any,
      sort: ['createdAt:desc'],
      pagination: { page: currentPage.value, pageSize: 5 },
    })
    console.debug('orders response:', ordersResponse)
    totalPages.value = (ordersResponse as any)?.meta?.pagination?.pageCount || 1
    return ordersResponse
  },
  {
    server: false,
    lazy: true,
    watch: [() => authStore.user?.email, statusFilter, currentPage],
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
      <div class="order-history__filters">
        <button
          v-for="[key, label] of [['', 'Все'], ['new', 'Новые'], ['processed', 'В обработке'], ['delivered', 'Доставлен'], ['cancelled', 'Отменён']]"
          :key="key"
          class="order-history__filter-btn"
          :class="{ 'order-history__filter-btn_active': statusFilter === key || (!statusFilter && !key) }"
          @click="statusFilter = key || null"
        >
          {{ label }}
        </button>
      </div>
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
          <img
            v-if="order.items?.[0]?.image"
            :src="`${config.public.strapi.url}${order.items[0].image}`"
            :alt="order.items[0].name"
            class="order-history__thumb"
          />
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
          <div class="order-history__item-actions">
            <NuxtLink
              :to="`/${currentLocale}/cabinet/${order.documentId || order.id}`"
              class="order-history__item-link"
            >
              Просмотр
            </NuxtLink>
            <UButton
              v-if="canCancel(order)"
              variant="secondary"
              :is-disabled="cancellingId === (order.documentId || order.id)"
              class="order-history__cancel-btn"
              @click="cancelOrder(order)"
            >
              {{ cancellingId === (order.documentId || order.id) ? '...' : 'Отменить' }}
            </UButton>
          </div>
        </li>
      </ul>
      <div v-if="totalPages > 1" class="order-history__pagination">
        <UButton
          variant="secondary"
          :is-disabled="currentPage <= 1"
          @click="currentPage--"
        >
          ← Назад
        </UButton>
        <span class="order-history__page-info">{{ currentPage }} / {{ totalPages }}</span>
        <UButton
          variant="secondary"
          :is-disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Вперёд →
        </UButton>
      </div>
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
    grid-template-columns: auto 1fr auto auto;
    gap: toRem(12);
    align-items: center;
    padding: toRem(12);
    background: var(--bg-secondary);
    border-radius: toRem(10);
    transition: background var(--transition-duration);

    @include hover {
      background: var(--bg-hover);
    }
  }

  &__thumb {
    width: toRem(48);
    height: toRem(48);
    object-fit: cover;
    border-radius: toRem(6);
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

  &__item-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: toRem(6);
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

  &__cancel-btn {
    font-size: toRem(12);
    padding: toRem(2) toRem(8);
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: toRem(8);
    margin-block-end: toRem(16);
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: toRem(16);
    margin-block-start: toRem(20);
  }

  &__page-info {
    font-size: toRem(14);
    color: var(--text-muted);
  }

  &__filter-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: toRem(20);
    padding: toRem(4) toRem(14);
    font-size: toRem(13);
    cursor: pointer;
    transition: all var(--transition-duration);

    &_active {
      background: var(--primary-color);
      color: #fff;
      border-color: var(--primary-color);
    }

    @include hover {
      opacity: 0.85;
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
