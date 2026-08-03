<script setup lang="ts">
import ShowModalCheckoutForm from '~/components/show-modal/ShowModalCheckoutForm.vue'
import { cartTranslations } from '~/locales/cart'
import { discountProductTranslations } from '~/locales/discountProduct'
import { buttonTranslations } from '~/locales/button'

const { currentLocale } = useLocale()
const cartT = computed(() => cartTranslations[currentLocale.value])
const discountT = computed(() => discountProductTranslations[currentLocale.value])
const buttonT = computed(() => buttonTranslations[currentLocale.value])
const cartStore = useCartStore()
const config = useRuntimeConfig()

const dialogRef = useTemplateRef<HTMLDialogElement>('cart-dialog')
const { open, close, isOpen } = useDialog('cartDialog', dialogRef, { useShowMethod: false })

defineExpose({ open, close, isOpen })

const checkoutDialogRef = useTemplateRef<InstanceType<typeof ShowModalCheckoutForm>>('checkoutDialogRef')

// Превью товара обрабатывает родитель (Header) — модалка живёт на его уровне,
// как и в личном кабинете (OrderHistory). Корзина только сообщает о клике.
const emit = defineEmits<{
  preview: [product: Product]
}>()

// Discount products for recommendations
const { data: discountProducts } = useAsyncData(
  `cart-discount-${currentLocale.value}`,
  async () => {
    const { find } = useStrapi()
    const response = await find<Product>('products', {
      filters: {
        isDiscount: true,
        locale: { $eq: currentLocale.value },
      },
      pagination: { pageSize: 100 } as PaginationMeta,
      populate: {
        image: { fields: ['alternativeText', 'url'] },
        subcategory: {
          fields: ['name', 'slug'],
          populate: {
            category: { fields: ['name', 'slug'] },
          },
        },
      },
    } as any)
    return response.data || []
  },
  { server: false, lazy: true },
)

function closeAndGoToCatalog() {
  close?.()
  navigateTo(`/${currentLocale.value}`)
}

onMounted(() => {
  cartStore.loadCart()
})
</script>

<template>
  <dialog ref="cart-dialog" class="cart-dialog">
    <div class="cart-dialog__panel">
      <header class="cart-dialog__header">
        <h2 class="cart-dialog__title">{{ cartT.title }}</h2>
        <div class="cart-dialog__header-right">
          <span class="cart-dialog__count" v-if="cartStore.totalItems > 0">
            {{ cartStore.totalItems }}
          </span>
          <button
            class="cart-dialog__close"
            aria-label="Закрыть корзину"
            @click="close"
          >
            <Icon name="mingcute:close-line" />
          </button>
        </div>
      </header>

      <!-- Empty cart -->
      <div v-if="cartStore.totalItems === 0" class="cart-dialog__empty">
        <div class="cart-dialog__empty-icon">
          <Icon name="mingcute:shopping-bag-2-line" />
        </div>
        <p class="cart-dialog__empty-title">{{ cartT.cartEmpty }}</p>
        <p class="cart-dialog__empty-sub">{{ cartT.cartEmptySub }}</p>
        <UButton
          variant="primary"
          class="cart-dialog__empty-cta"
          @click="closeAndGoToCatalog"
        >
          {{ cartT.cartEmptyCta }}
        </UButton>

        <div v-if="discountProducts?.length" class="cart-dialog__recommend">
          <div class="cart-dialog__recommend-header">
            <Icon name="mdi:fire" class="cart-dialog__recommend-fire" />
            <span class="cart-dialog__recommend-title">{{ discountT.discount }}</span>
          </div>
          <div class="cart-dialog__recommend-track">
            <button
              v-for="prod in discountProducts"
              :key="prod.documentId"
              type="button"
              class="cart-dialog__recommend-card"
              @click="emit('preview', prod)"
            >
              <UImage
                v-if="prod.mainImage?.url || prod.image?.length"
                :src="prod.mainImage?.url || prod.image?.[0]?.url"
                :alt="prod.name"
                type="product"
                width="160"
                height="120"
              />
              <div class="cart-dialog__recommend-info">
                <span class="cart-dialog__recommend-name">{{ prod.name }}</span>
                <span class="cart-dialog__recommend-price">{{ formatPrice(prod.price) }}</span>
              </div>
            </button>
          </div>
        </div>

        <div class="cart-dialog__delivery">
          <div class="cart-dialog__delivery-header">
            <Icon name="mingcute:truck-line" class="cart-dialog__delivery-icon" />
            <span class="cart-dialog__delivery-title">{{ cartT.deliveryTitle }}</span>
          </div>
          <div class="cart-dialog__delivery-items">
            <div class="cart-dialog__delivery-item">
              <Icon name="mingcute:check-line" />
              <span>{{ cartT.deliveryFree }}</span>
            </div>
            <div class="cart-dialog__delivery-item">
              <Icon name="mingcute:check-line" />
              <span>{{ cartT.deliveryPay }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- With items -->
      <template v-else>
        <div class="cart-dialog__items">
          <CartShopping />
        </div>
        <UButton
          variant="primary"
          class="cart-dialog__checkout-btn"
          @click="checkoutDialogRef?.open?.()"
        >
          <span class="cart-dialog__checkout-label">Оформить</span>
          <span class="cart-dialog__checkout-price">
            <Icon name="my-icon:icon-by-regular" />
            {{ formatPrice(cartStore.totalPrice) }}
          </span>
        </UButton>
      </template>
    </div>
  </dialog>

  <ShowModalCheckoutForm ref="checkoutDialogRef" />
</template>

<style lang="scss" scoped>
.cart-dialog {
   margin: 0;
  margin-inline-start: auto;
  height: 100dvh;
  max-height: 100dvh;
  max-width: 100dvw;
  background: transparent;
 border-width: 0 toEm(0) toEm(0) toEm(3);
 border-radius: toEm(4);
 border-style: solid;
 border-color: var(--border-color-transparent);
  translate: 100%;
  opacity: 0;
  transition:
    translate var(--transition-duration),
    opacity var(--transition-duration),
    overlay var(--transition-duration) allow-discrete,
    display var(--transition-duration) allow-discrete;
  @include adaptiveValue("width", 480, 320);

  &[open] {
    translate: 0;
    opacity: 1;
  }

  @starting-style {
    &[open] {
      translate: 100%;
      opacity: 0;
    }
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: grayscale(100%);
    opacity: 0;
    transition:
      opacity var(--transition-duration),
      overlay var(--transition-duration) allow-discrete,
      display var(--transition-duration) allow-discrete;
  }

  &[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    &[open]::backdrop {
      opacity: 0;
    }
  }
}

.cart-dialog__panel {
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: toRem(4);
  padding: toRem(4);
  background: transparent;
  backdrop-filter: blur(22px);
}

// ====== Header ======
.cart-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: toRem(16);
  background: var(--bg);
  opacity: 0.95;
  border-radius: toRem(10);
  border: 1px solid var(--border-color);
}

.cart-dialog__title {
  font-weight: 700;
  @include adaptiveValue("font-size", 22, 18);
}

.cart-dialog__header-right {
  display: flex;
  align-items: center;
  gap: toRem(12);
}

.cart-dialog__count {
  display: grid;
  place-items: center;
  width: toRem(24);
  height: toRem(24);
  border-radius: 50%;
  background: var(--danger-color);
  color: #fff;
  font-size: toRem(12);
  font-weight: 700;
}

.cart-dialog__close {
  display: grid;
  place-items: center;
  width: toRem(36);
  height: toRem(36);
  border-radius: 50%;
  cursor: pointer;
  transition: background var(--transition-duration);

  @include hover {
    background: var(--bg-secondary);
  }

  svg {
    font-size: toRem(22);
    color: var(--color);
  }
}

// ====== Empty state ======
.cart-dialog__empty {
  display: grid;
  gap: toRem(12);
  justify-items: center;
  align-content: center;
  padding: toRem(32) toRem(16);
  text-align: center;
  overflow-y: auto;
  overflow-x: hidden;

  > * {
    min-width: 0;   // разрешить grid-элементам сужаться под контейнер
  }
}

.cart-dialog__empty-icon {
  width: toRem(64);
  height: toRem(64);
  border-radius: 50%;
  background: var(--bg-secondary);
  display: grid;
  place-items: center;

  svg {
    font-size: toRem(28);
    color: var(--text-muted);
  }
}

.cart-dialog__empty-title {
  font-weight: 700;
  margin: 0;
  @include adaptiveValue("font-size", 20, 18);
}

.cart-dialog__empty-sub {
  color: var(--text-muted);
  font-size: toRem(14);
  margin: 0;
  line-height: 1.4;
  max-width: toRem(280);
}

.cart-dialog__empty-cta {
  margin-block-start: toRem(4);
}

// ====== Recommendations ======
.cart-dialog__recommend {
  width: 100%;
  min-width: 0;
  margin-block-start: toRem(24);
  text-align: start;
}

.cart-dialog__recommend-header {
  display: flex;
  align-items: center;
  gap: toRem(6);
  margin-block-end: toRem(8);

  svg {
    font-size: toRem(20);
    color: var(--warning-color);
  }
}

.cart-dialog__recommend-fire {
  flex-shrink: 0;
}

.cart-dialog__recommend-title {
  font-weight: 700;
  font-size: toRem(15);
  color: var(--color);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.cart-dialog__recommend-track {
  display: flex;
  gap: toRem(8);
  overflow-x: auto;
  scrollbar-width: thin;
  padding-block-end: toRem(4);

  &::-webkit-scrollbar {
    height: toRem(4);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: toRem(2);
  }
}

.cart-dialog__recommend-card {
  flex-shrink: 0;
  width: toRem(160);
  @include containerParent(product, inline-size);
  display: grid;
  gap: toRem(6);
  padding: toRem(8);
  border: none;
  border-radius: toRem(8);
  background: var(--bg-secondary);
  color: var(--color);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: background var(--transition-duration);

  @include hover {
    background: var(--bg-hover);
  }
}

.cart-dialog__recommend-info {
  display: grid;
  gap: toRem(2);
}

.cart-dialog__recommend-name {
  font-weight: 500;
  font-size: toRem(13);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-dialog__recommend-price {
  font-weight: 700;
  color: var(--primary-color);
  font-size: toRem(14);
}

// ====== Delivery info ======
.cart-dialog__delivery {
  width: 100%;
  margin-block-start: toRem(20);
  padding: toRem(12);
  background: var(--bg-secondary);
  border-radius: toRem(8);
}

.cart-dialog__delivery-header {
  display: flex;
  align-items: center;
  gap: toRem(6);
  margin-block-end: toRem(8);
}

.cart-dialog__delivery-icon {
  font-size: toRem(18);
  color: var(--primary-color);
}

.cart-dialog__delivery-title {
  font-weight: 600;
  font-size: toRem(14);
}

.cart-dialog__delivery-items {
  display: grid;
  gap: toRem(4);
}

.cart-dialog__delivery-item {
  display: flex;
  align-items: center;
  gap: toRem(6);
  font-size: toRem(13);
  color: var(--text-muted);

  svg {
    font-size: toRem(14);
    color: var(--success-color);
    flex-shrink: 0;
  }
}

// ====== Items area ======
.cart-dialog__items {
  overflow-y: auto;
  padding: toRem(12);
  display: flex;
  flex-direction: column;
  gap: toRem(8);
}

// ====== Checkout button ======
.cart-dialog__checkout-btn {
  width: 100%;
  padding-block: toRem(12);
  border-radius: toRem(10);

  &:active {
    transform: scale(0.97);
    box-shadow: inset 0 toRem(2) toRem(4) rgba(0, 0, 0, 0.2);
  }

  :deep(.button-content) {
    flex: 1;
    justify-content: space-between;
  }
}

.cart-dialog__checkout-label {
  font-weight: 600;
}

.cart-dialog__checkout-price {
  display: flex;
  align-items: center;
  gap: toRem(4);
  font-weight: 700;

  svg {
    font-size: toRem(14);
  }
}

</style>
