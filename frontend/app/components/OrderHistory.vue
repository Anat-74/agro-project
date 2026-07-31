<script setup lang="ts">
import { cabinetTranslations } from '~/locales/cabinet'

const { currentLocale } = useLocale()
const cabinetT = computed(() => cabinetTranslations[currentLocale.value])
const { find, update: strapiUpdate } = useStrapi()
const authStore = useAuthStore()

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
    alert(cabinetT.value.cancelError + ':\n' + errText.slice(0, 500))
  } finally {
    cancellingId.value = null
  }
}

const cartStore = useCartStore()
const route = useRoute()

const repeatOrder = (order: any) => {
  if (!order.items?.length) return
  order.items.forEach((item: any) => {
    const slug = item.categorySlug || (route.params.categorySlug as string) || ''
    cartStore.addToCart(
      { documentId: item.productId, name: item.name, price: item.price, image: item.mainImage } as any,
      slug,
      item.subcategorySlug || null
    )
  })
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

import ShowModalDiscountProduct from '~/components/show-modal/ShowModalDiscountProduct.vue'
import { nextTick } from 'vue'

const productModalRef = useTemplateRef<InstanceType<typeof ShowModalDiscountProduct>>('product-modal')
const previewProduct = ref<any>(null)

const openProductModal = (item: any) => {
  if (!item.slug) return
  previewProduct.value = {
    documentId: item.productId || item.documentId,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.mainImage ? [{ url: item.mainImage.replace(/^\//, '') }] : [],
    mainImage: null,
    description: '',
    characteristics: '',
    subcategory: item.subcategorySlug
      ? { slug: item.subcategorySlug, category: { slug: item.categorySlug || '' } }
      : null,
  }
  nextTick(() => productModalRef.value?.openModal?.())
}

const statusLabel = computed(() => ({
  new: cabinetT.value.statusNew,
  processed: cabinetT.value.statusProcessed,
  confirmed: cabinetT.value.statusConfirmed,
  delivered: cabinetT.value.statusDelivered,
  cancelled: cabinetT.value.statusCancelled,
}))
</script>

<template>
  <ClientOnly>
    <div class="order-history">
      <div class="order-history__filters">
        <UButton
          v-for="[key, labelKey] of [['', 'filterAll'], ['new', 'filterNew'], ['processed', 'filterProcessed'], ['delivered', 'filterDelivered'], ['cancelled', 'filterCancelled']]"
          :key="key"
          class="order-history__filter-btn"
          :class="{ 'order-history__filter-btn_active': statusFilter === key || (!statusFilter && !key) }"
          @click="statusFilter = key || null"
        >
          {{ cabinetT[labelKey] }}
        </UButton>
      </div>
      <OrderHistorySkeleton v-if="status === 'pending'" />

      <p v-else-if="status === 'error'" class="order-history__empty">
        {{ cabinetT.error }}
      </p>

      <p v-else-if="!orders?.length" class="order-history__empty">
        {{ cabinetT.noOrders }}
      </p>

      <ul v-else class="order-history__list">
        <li
          v-for="order in orders"
          :key="order.documentId || order.id"
          class="order-history__item"
        >
          <UImage
            v-if="order.items?.[0]?.mainImage"
            :src="order.items[0].mainImage"
            :alt="order.items[0].name"
            type="thumbnail"
            class="order-history__thumb"
            :class="{ 'order-history__thumb_clickable': order.items[0]?.slug }"
            @click="order.items[0]?.mainImage && order.items[0]?.slug && openProductModal(order.items[0])"
          />
          <div class="order-history__item-info">
            <p class="order-history__item-id">
              {{ cabinetT.orderPrefix }}{{ order.documentId || order.id }}
            </p>
            <p class="order-history__item-date">
              {{ new Date(order.createdAt).toLocaleDateString() }}
            </p>
            <span
              class="order-history__badge"
              :class="`order-history__badge_${order.statusOrders || 'new'}`"
            >
              {{ (statusLabel as any)[order.statusOrders] || cabinetT.statusNew }}
            </span>
          </div>
          <div class="order-history__item-total">
            {{ order.total }} ₽
          </div>
          <div class="order-history__item-actions">
            <UButton variant="secondary" :is-disabled="false" class="order-history__repeat-btn" @click="repeatOrder(order)">
              {{ cabinetT.repeat }}
            </UButton>
            <NuxtLink
              :to="`/${currentLocale}/cabinet/${order.documentId || order.id}`"
              class="order-history__item-link"
            >
              {{ cabinetT.viewOrder }}
            </NuxtLink>
            <UButton
              v-if="canCancel(order)"
              variant="secondary"
              :is-disabled="cancellingId === (order.documentId || order.id)"
              class="order-history__cancel-btn"
              @click="cancelOrder(order)"
            >
              {{ cancellingId === (order.documentId || order.id) ? '...' : cabinetT.cancel }}
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
          {{ cabinetT.back }}
        </UButton>
        <span class="order-history__page-info">{{ currentPage }} / {{ totalPages }}</span>
        <UButton
          variant="secondary"
          :is-disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          {{ cabinetT.forward }}
        </UButton>
      </div>
    </div>

    <ShowModalDiscountProduct
      v-if="previewProduct"
      ref="product-modal"
      :product="previewProduct"
    />
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
    grid-template-columns: auto 1fr auto;
    gap: toRem(12);
    align-items: center;
    padding: toRem(16);
    background: var(--bg-secondary);
    border-radius: toRem(10);
    transition: background var(--transition-duration);

    @media (max-width: $mobile) {
      grid-template-columns: 1fr;
      gap: toRem(8);
    }

    @include hover {
      background: var(--bg-hover);
    }
  }

  &__thumb {
    flex-shrink: 0;
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
    @include adaptiveValue("font-size", 20, 18);
    white-space: nowrap;

    @media (max-width: $mobile) {
      justify-self: end;
    }
  }

  &__item-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: toRem(12);

    @media (max-width: $mobile) {
      flex-wrap: wrap;
      justify-content: flex-start;
    }
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
    padding: toRem(4) toRem(10);
  }

  &__repeat-btn {
    font-size: toRem(12);
    padding: toRem(4) toRem(10);
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: toRem(8);
    margin-block-end: toRem(16);
  }

  &__thumb_clickable {
    cursor: pointer;

    @include hover {
      :deep(.app-image__img) {
        transform: scale(1.1);
      }
    }
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: toRem(16);
    margin-block-start: toRem(24);
  }

  &__page-info {
    font-size: toRem(14);
    color: var(--text-muted);
  }

  &__filter-btn {
    color: var(--color);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: toRem(20);
    padding: toRem(6) toRem(16);
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
    padding: toRem(3) toRem(12);
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
