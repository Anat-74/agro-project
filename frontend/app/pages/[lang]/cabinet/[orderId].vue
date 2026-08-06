<script setup lang="ts">
import { cabinetTranslations } from '~/locales/cabinet'

definePageMeta({
  middleware: 'auth',
})

const { currentLocale } = useLocale()
const t = computed(() => cabinetTranslations[currentLocale.value])
const route = useRoute()
const orderId = computed(() => route.params.orderId as string)

const { findOne, update: updateStrapi } = useStrapi()

const cancelling = ref(false)

const cancelOrder = async () => {
  if (!order.value || !confirm(t.value.cancelOrder + '?')) return
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

const statusLabel = computed(() => ({
  new: t.value.statusNew,
  processed: t.value.statusProcessed,
  confirmed: t.value.statusConfirmed,
  delivered: t.value.statusDelivered,
  cancelled: t.value.statusCancelled,
}))
</script>

<template>
  <CabinetLayout>
    <div class="order-detail">
      <h1 class="order-detail__title">{{ t.orderDetail }} #{{ orderId }}</h1>

      <p v-if="status === 'pending'" class="order-detail__status-text">{{ t.loading }}</p>
      <p v-else-if="status === 'error'" class="order-detail__status-text">{{ t.error }}</p>
      <p v-else-if="!order" class="order-detail__status-text">{{ t.notFound }}</p>

      <template v-else>
        <div class="order-detail__card">
          <div class="order-detail__meta">
            <div class="order-detail__meta-row">
              <span class="order-detail__meta-label">{{ t.status }}:</span>
              <span
                class="order-detail__badge"
                :class="`order-detail__badge_${order.statusOrders || 'new'}`"
              >
                {{ (statusLabel as any)[order.statusOrders] || t.statusNew }}
              </span>
            </div>
            <div class="order-detail__meta-row">
              <span class="order-detail__meta-label">{{ t.date }}:</span>
              <span>{{ new Date(order.createdAt).toLocaleDateString() }}</span>
            </div>
            <div class="order-detail__meta-row">
              <span class="order-detail__meta-label">Email:</span>
              <span>{{ order.email }}</span>
            </div>
            <div class="order-detail__meta-row">
              <span class="order-detail__meta-label">{{ t.phone }}:</span>
              <span>{{ order.phone }}</span>
            </div>
          </div>

          <UButton
            v-if="order.statusOrders === 'new' || order.statusOrders === 'processed'"
            variant="secondary"
            :is-disabled="cancelling"
            class="order-detail__cancel-btn"
            @click="cancelOrder"
          >
            {{ cancelling ? t.cancelling : t.cancelOrder }}
          </UButton>
        </div>

        <h2 class="order-detail__section-title">{{ t.items }}</h2>

        <div class="order-detail__items">
          <div
            v-for="(item, idx) in order.items"
            :key="idx"
            class="order-detail__item"
          >
            <UImage
              v-if="item.mainImage"
              :src="item.mainImage"
              :alt="item.name"
              type="product"
              width="150"
              height="112"
              class="order-detail__item-img"
            />
            <div class="order-detail__item-info">
              <span class="order-detail__item-name">{{ item.name }}</span>
              <span class="order-detail__item-qty">{{ item.quantity }} шт.</span>
            </div>
            <span class="order-detail__item-price">{{ item.price }} ₽</span>
          </div>
        </div>

        <div class="order-detail__total">
          <span class="order-detail__total-label">{{ t.total }}:</span>
          <span class="order-detail__total-value">{{ order.total }} ₽</span>
        </div>
      </template>
    </div>
  </CabinetLayout>
</template>

<style lang="scss" scoped>
.order-detail {
  &__title {
    @include adaptiveValue("font-size", 26, 20);
    font-weight: 700;
    margin-block-end: toRem(24);
  }

  &__status-text {
    text-align: center;
    padding-block: toRem(40);
    color: var(--text-muted);
  }

  &__card {
    background: var(--bg-secondary);
    border-radius: toRem(12);
    padding: toRem(24);
    margin-block-end: toRem(24);
    display: grid;
    gap: toRem(16);
  }

  &__meta {
    display: grid;
    gap: toRem(10);
  }

  &__meta-row {
    display: flex;
    align-items: center;
    gap: toRem(8);
    font-size: toRem(15);
    flex-wrap: wrap;
  }

  &__meta-label {
    font-weight: 600;
    min-width: toRem(80);
    color: var(--text-muted);
  }

  &__section-title {
    font-weight: 600;
    @include adaptiveValue("font-size", 20, 16);
    margin-block-end: toRem(12);
  }

  &__items {
    display: grid;
    gap: toRem(8);
    margin-block-end: toRem(20);
  }

  &__item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: toRem(12);
    align-items: center;
    padding: toRem(12);
    background: var(--bg-secondary);
    border-radius: toRem(10);

    @media (max-width: $mobile) {
      grid-template-columns: 1fr;
      justify-items: start;
    }
  }

  &__item-img {
    flex-shrink: 0;
    width: toRem(150);
    @include containerParent(product, inline-size);
  }

  &__item-info {
    display: grid;
    gap: toRem(4);
    min-width: 0;
  }

  &__item-name {
    font-weight: 500;
  }

  &__item-qty {
    font-size: toRem(13);
    color: var(--text-muted);
  }

  &__item-price {
    font-weight: 600;
    white-space: nowrap;
  }

  &__total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: toRem(16);
    background: var(--bg-secondary);
    border-radius: toRem(10);
  }

  &__total-label {
    font-weight: 600;
    @include adaptiveValue("font-size", 18, 16);
  }

  &__total-value {
    font-weight: 700;
    @include adaptiveValue("font-size", 22, 18);
    color: var(--primary-color);
  }

  &__cancel-btn {
    justify-self: start;
  }

  &__badge {
    display: inline-block;
    font-size: toRem(12);
    font-weight: 600;
    padding: toRem(4) toRem(12);
    border-radius: toRem(20);

    &_new { color: #2e7d32; background: #e8f5e9; }
    &_processed { color: #f57f17; background: #fff8e1; }
    &_confirmed { color: #1565c0; background: #e3f2fd; }
    &_delivered { color: #2e7d32; background: #e8f5e9; }
    &_cancelled { color: #c62828; background: #ffebee; }
  }
}
</style>
