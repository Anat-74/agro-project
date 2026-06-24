<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { currentLocale } = useLocale()
const route = useRoute()
const router = useRouter()
const orderId = computed(() => route.params.orderId as string)
const config = useRuntimeConfig()

const { findOne, update: updateStrapi } = useStrapi()

const cancelling = ref(false)

const cancelOrder = async () => {
  if (!order.value || !confirm('Отменить заказ?')) return
  cancelling.value = true
  try {
    const id = order.value.documentId || order.value.id
    await updateStrapi('orders', id, { statusOrders: 'cancelled' } as any)
    order.value.statusOrders = 'cancelled'
  } catch (e) {
    console.error('Cancel error:', e)
  } finally {
    cancelling.value = false
  }
}
const orderKey = computed(() => `order-${route.params.orderId}`)

const { data: order, status } = useAsyncData(
  orderKey,
  async () => {
    return await findOne('orders', route.params.orderId as string)
  },
  {
    server: false,
    lazy: true,
    transform: (response: any) => response?.data || null,
  },
)

const statusLabel: Record<string, string> = {
  new: 'Новый',
  processed: 'В обработке',
  confirmed: 'Подтверждён',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

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

    <p v-if="status === 'pending'" class="order-detail__loading">Загрузка...</p>

    <p v-else-if="status === 'error'" class="order-detail__loading">
      Ошибка загрузки заказа
    </p>

    <p v-else-if="!order" class="order-detail__loading">
      Заказ не найден
    </p>

    <div v-else class="order-detail__card">
      <div class="order-detail__meta">
        <p>
          <strong>Статус:</strong>
          <span
            class="order-detail__badge"
            :class="`order-detail__badge_${order.statusOrders || 'new'}`"
          >
            {{ statusLabel[order.statusOrders] || 'Новый' }}
          </span>
          <UButton
            v-if="order.statusOrders === 'new' || order.statusOrders === 'processed'"
            variant="secondary"
            :is-disabled="cancelling"
            class="order-detail__cancel-btn"
            @click="cancelOrder"
          >
            {{ cancelling ? 'Отмена...' : 'Отменить заказ' }}
          </UButton>
        </p>
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
          <img
            v-if="item.image"
            :src="`${config.public.strapi.url}${item.image}`"
            :alt="item.name"
            class="order-detail__item-img"
          />
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
    grid-template-columns: auto 1fr auto auto;
    gap: toRem(12);
    align-items: center;
    padding: toRem(8) 0;
    border-block-end: 1px solid var(--border-color);

    &:last-child {
      border-block-end: none;
    }
  }

  &__item-img {
    width: toRem(48);
    height: toRem(48);
    object-fit: cover;
    border-radius: toRem(6);
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

  &__cancel-btn {
    margin-inline-start: toRem(16);
  }

  &__badge {
    display: inline-block;
    font-size: toRem(12);
    font-weight: 600;
    padding: toRem(2) toRem(10);
    border-radius: toRem(20);
    margin-inline-start: toRem(8);

    &_new {
      color: #2e7d32;
      background: #e8f5e9;
    }

    &_processed {
      color: #f57f17;
      background: #fff8e1;
    }

    &_confirmed {
      color: #1565c0;
      background: #e3f2fd;
    }

    &_delivered {
      color: #2e7d32;
      background: #e8f5e9;
    }

    &_cancelled {
      color: #c62828;
      background: #ffebee;
    }
  }
}
</style>
